import { PostsApi } from "#src/posts/infrastructure/http/posts.api.ts";
import { UsersApi } from "#src/users/infrastructure/http/users.api.ts";
import { HttpApi, HttpApiMiddleware } from "effect/http-api";

export class Api extends HttpApi.make("api")
  .add(PostsApi)
  .add(UsersApi)
  .middleware(HttpApiMiddleware.ProblemDetails)
  .prefix("/api") {}
