import { AccessToken } from "#src/auth/domain/auth.entity.ts";
import { UnauthorizedError } from "#src/auth/domain/auth.errors.ts";
import { Authentication } from "#src/auth/infrastructure/http/authentication.middleware.ts";
import { Password, User, Username } from "#src/users/domain/user.entity.ts";
import { UsernameTakenError } from "#src/users/domain/user.errors.ts";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

export class AuthApi extends HttpApiGroup.make("auth")
  .add(
    HttpApiEndpoint.post("register", "/register", {
      // Schema.Redacted : le mot de passe décodé n'apparaît jamais en clair dans un log.
      payload: Schema.Struct({ username: Username, password: Schema.Redacted(Password) }),
      success: AccessToken,
      error: UsernameTakenError,
    }).annotate(OpenApi.Summary, "Register"),
    HttpApiEndpoint.post("login", "/login", {
      // Pas de `Username`/`Password` ici : une règle de format trahirait ce qui est valide.
      payload: Schema.Struct({ username: Schema.String, password: Schema.Redacted(Schema.String) }),
      success: AccessToken,
      error: UnauthorizedError,
    }).annotate(OpenApi.Summary, "Login"),
    HttpApiEndpoint.get("me", "/me", { success: User })
      .middleware(Authentication)
      .annotate(OpenApi.Summary, "Current user"),
  )
  .prefix("/auth") {}
