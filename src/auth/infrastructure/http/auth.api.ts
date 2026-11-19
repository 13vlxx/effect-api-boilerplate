import { Authentication } from "#src/auth/infrastructure/http/authentication.middleware.ts";
import { Password, User, Username } from "#src/users/domain/user.entity.ts";
import { UsernameTakenError } from "#src/users/domain/user.errors.ts";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

export class AuthApi extends HttpApiGroup.make("auth")
  .add(
    HttpApiEndpoint.post("register", "/register", {
      // Schema.Redacted : le mot de passe décodé n'apparaît jamais en clair dans un log.
      payload: Schema.Struct({ username: Username, password: Schema.Redacted(Password) }),
      success: User.pipe(HttpApiSchema.status(201)),
      error: UsernameTakenError,
    }).annotate(OpenApi.Summary, "Register"),
    HttpApiEndpoint.get("me", "/me", { success: User })
      .middleware(Authentication)
      .annotate(OpenApi.Summary, "Current user"),
  )
  .prefix("/auth") {}
