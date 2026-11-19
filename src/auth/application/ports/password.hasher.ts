import { Context, Effect, Option, Redacted } from "effect";

export class PasswordHasher extends Context.Service<
  PasswordHasher,
  {
    readonly hash: (password: Redacted.Redacted<string>) => Effect.Effect<Redacted.Redacted>;
    readonly verify: (
      password: Redacted.Redacted<string>,
      hash: Option.Option<Redacted.Redacted<string>>,
    ) => Effect.Effect<boolean>;
  }
>()("auth/PasswordHasher") {}
