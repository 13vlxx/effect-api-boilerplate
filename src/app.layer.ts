import { AuthMiddlewareLive } from "#src/auth/auth.layer.ts";
import { PostsLive } from "#src/posts/posts.layer.ts";
import { UsersLive } from "#src/users/users.layer.ts";
import { AppConfig } from "#src/_shared/config/app.config.ts";
import { DatabaseLive } from "#src/_shared/database/database.layer.ts";
import { Api } from "#src/_shared/http/api.ts";
import { NodeHttpServer } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/http";
import { HttpApiBuilder, HttpApiMiddleware, HttpApiScalar } from "effect/http-api";
import { createServer } from "node:http";

const ApiRoutes = HttpApiBuilder.layer(Api, { openapiPath: "/api/docs/openapi.json" }).pipe(
  Layer.provide([PostsLive, UsersLive]),
  Layer.provide([
    AuthMiddlewareLive,
    HttpApiMiddleware.layerProblemDetails({ includeDetails: true }),
  ]),
);

const DocsRoutes = HttpApiScalar.layer(Api, { path: "/api/docs" });

const HttpServerLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* AppConfig;
    return NodeHttpServer.layer(createServer, { port: config.port });
  }),
);

export const AppLayer = HttpRouter.serve(Layer.mergeAll(ApiRoutes, DocsRoutes)).pipe(
  Layer.provide(DatabaseLive),
  Layer.provide(HttpServerLive),
  Layer.provide(AppConfig.layer),
);
