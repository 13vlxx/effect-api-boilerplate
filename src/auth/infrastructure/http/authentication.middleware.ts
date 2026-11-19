import { UnauthorizedError } from "#src/auth/domain/auth.errors.ts";
import type { User } from "#src/users/domain/user.entity.ts";
import { Context } from "effect";
import { HttpApiMiddleware, HttpApiSecurity } from "effect/http-api";

// L'utilisateur connecté, fourni par le middleware aux routes protégées.
export class CurrentUser extends Context.Service<CurrentUser, User>()("auth/CurrentUser") {}

// Le contrat du middleware : schéma de sécurité HTTP Basic, service fourni, erreur possible.
export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  { provides: CurrentUser; requires: never }
>()("auth/Authentication", {
  security: { basic: HttpApiSecurity.basic },
  error: UnauthorizedError,
}) {}
