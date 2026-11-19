import type { AuthUser } from "#src/auth/domain/auth.entity.ts";
import type { UnauthorizedError } from "#src/auth/domain/auth.errors.ts";
import { Context, type Effect, type Redacted } from "effect";

export class TokenVerifier extends Context.Service<
  TokenVerifier,
  {
    readonly verify: (
      token: Redacted.Redacted<string>,
    ) => Effect.Effect<AuthUser, UnauthorizedError>;
  }
>()("auth/TokenVerifier") {}
