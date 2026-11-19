import type { AuthUser } from "#src/auth/domain/auth.entity.ts";
import { UnauthorizedError } from "#src/auth/domain/auth.errors.ts";
import { Context } from "effect";
import { HttpApiMiddleware, HttpApiSecurity } from "effect/http-api";

// L'utilisateur connecté, fourni par le middleware aux routes protégées.
export class CurrentUser extends Context.Service<CurrentUser, AuthUser>()("auth/CurrentUser") {}

// Le contrat du middleware : access token Bearer émis par Logto, service fourni, erreur possible.
export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  { provides: CurrentUser; requires: never }
>()("auth/Authentication", {
  security: { bearer: HttpApiSecurity.bearer },
  error: UnauthorizedError,
}) {}
