import { PasswordHasher } from "#src/auth/application/ports/password.hasher.ts";
import { hash, verify } from "@node-rs/argon2";
import { Effect, Layer, Option, Redacted } from "effect";

const options = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export const Argon2PasswordHasherLive = Layer.effect(
  PasswordHasher,
  Effect.gen(function* () {
    const dummyHash = yield* Effect.promise(() => hash("dummy", options));

    return PasswordHasher.of({
      hash: (password) =>
        Effect.promise(async () =>
          Redacted.make(await hash(Redacted.value(password), options)),
        ).pipe(Effect.withSpan("PasswordHasher.hash")),
      verify: (password, passwordHash) =>
        Effect.promise(async () => {
          const stored = Option.match(passwordHash, {
            onNone: () => dummyHash,
            onSome: Redacted.value,
          });
          const valid = await verify(stored, Redacted.value(password)).catch(() => false);
          return Option.isSome(passwordHash) && valid;
        }).pipe(Effect.withSpan("PasswordHasher.verify")),
    });
  }),
);
