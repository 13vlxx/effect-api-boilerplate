import type { AccessToken } from "#src/auth/domain/auth.entity.ts";
import type { UnauthorizedError } from "#src/auth/domain/auth.errors.ts";
import type { UserId } from "#src/users/domain/user.entity.ts";
import { Context, type Effect, type Redacted } from "effect";

export class TokenService extends Context.Service<
  TokenService,
  {
    readonly issue: (userId: UserId) => Effect.Effect<AccessToken>;
    readonly verify: (token: Redacted.Redacted<string>) => Effect.Effect<UserId, UnauthorizedError>;
  }
>()("auth/TokenService") {}
