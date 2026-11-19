import { AuthApi } from "#src/auth/infrastructure/http/auth.api.ts";
import { PostsApi } from "#src/posts/infrastructure/http/posts.api.ts";
import { HttpApi, HttpApiMiddleware } from "effect/http-api";

export class Api extends HttpApi.make("api")
  .add(AuthApi)
  .add(PostsApi)
  .middleware(HttpApiMiddleware.ProblemDetails)
  .prefix("/api") {}
