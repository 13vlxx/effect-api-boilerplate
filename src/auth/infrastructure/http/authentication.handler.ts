import { TokenVerifier } from "#src/auth/application/ports/token.verifier.ts";
import {
  Authentication,
  CurrentUser,
} from "#src/auth/infrastructure/http/authentication.middleware.ts";
import { Effect, Layer } from "effect";

// Implémentation du middleware : vérifie l'en-tête Authorization: Bearer à chaque requête protégée.
export const AuthenticationLive = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    const verifier = yield* TokenVerifier;
    return Authentication.of({
      bearer: Effect.fn("Authentication.bearer")(function* (httpEffect, { credential }) {
        const user = yield* verifier.verify(credential);
        return yield* Effect.provideService(httpEffect, CurrentUser, user);
      }),
    });
  }),
);
