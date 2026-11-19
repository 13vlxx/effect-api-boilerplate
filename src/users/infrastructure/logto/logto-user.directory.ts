import { AppConfig } from "#src/_shared/config/app.config.ts";
import { UserId } from "#src/auth/domain/auth.entity.ts";
import { UserDirectory } from "#src/users/application/ports/user.directory.ts";
import { User, UserCustomData, type UserCustomDataPatch } from "#src/users/domain/user.entity.ts";
import { DateTime, Effect, Exit, Layer, Option, Redacted, Schema } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http";

// Ressource de la Management API sur Logto OSS (le tenant par défaut).
const MANAGEMENT_API_RESOURCE = "https://default.logto.app/api";

const ManagementToken = Schema.Struct({ access_token: Schema.String });

// La forme de `GET /api/users/:id` chez Logto ; `createdAt` est en millisecondes.
const LogtoUser = Schema.Struct({
  id: UserId,
  username: Schema.NullOr(Schema.String),
  name: Schema.NullOr(Schema.String),
  avatar: Schema.NullOr(Schema.String),
  customData: UserCustomData,
  createdAt: Schema.Finite,
});

const toUser = (raw: typeof LogtoUser.Type): User =>
  new User({ ...raw, createdAt: DateTime.makeUnsafe(raw.createdAt) });

export const LogtoUserDirectoryLive = Layer.effect(
  UserDirectory,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const http = yield* HttpClient.HttpClient;

    const fetchToken = HttpClientRequest.post(`${config.logtoEndpoint}/oidc/token`).pipe(
      HttpClientRequest.basicAuth(config.logtoM2mClientId, config.logtoM2mClientSecret),
      HttpClientRequest.bodyUrlParams({
        grant_type: "client_credentials",
        resource: MANAGEMENT_API_RESOURCE,
        scope: "all",
      }),
      http.execute,
      Effect.flatMap(HttpClientResponse.filterStatusOk),
      Effect.flatMap(HttpClientResponse.schemaBodyJson(ManagementToken)),
      Effect.map((token) => Redacted.make(token.access_token)),
    );

    // Les tokens M2M de Logto durent 1 h ; un échec n'est jamais mis en cache.
    const getToken = yield* Effect.cachedWithTTL(fetchToken, (exit) =>
      Exit.isSuccess(exit) ? "50 minutes" : 0,
    );

    // 404 -> Option.none ; toute autre réponse non 2xx est une panne technique.
    const send = Effect.fn("LogtoManagementApi.send")(function* (
      request: HttpClientRequest.HttpClientRequest,
    ) {
      const token = yield* getToken;
      const response = yield* http.execute(HttpClientRequest.bearerToken(request, token));
      if (response.status === 404) return Option.none();
      return Option.some(yield* HttpClientResponse.filterStatusOk(response));
    });

    const userUrl = (id: UserId) => `${config.logtoEndpoint}/api/users/${encodeURIComponent(id)}`;

    // Les pannes (réseau, Logto, forme inattendue) deviennent des défauts : 500 sans détail.
    const findById = Effect.fn("UserDirectory.findById")(function* (id: UserId) {
      const response = yield* send(HttpClientRequest.get(userUrl(id)));
      if (Option.isNone(response)) return Option.none();
      const raw = yield* HttpClientResponse.schemaBodyJson(LogtoUser)(response.value);
      return Option.some(toUser(raw));
    }, Effect.orDie);

    const updateCustomData = Effect.fn("UserDirectory.updateCustomData")(function* (
      id: UserId,
      patch: UserCustomDataPatch,
    ) {
      const request = HttpClientRequest.patch(`${userUrl(id)}/custom-data`).pipe(
        HttpClientRequest.bodyJsonUnsafe({ customData: patch }),
      );
      const response = yield* send(request);
      if (Option.isNone(response)) return Option.none();
      // Logto ne renvoie que les customData : on relit l'utilisateur complet.
      return yield* findById(id);
    }, Effect.orDie);

    return UserDirectory.of({ findById, updateCustomData });
  }),
);
