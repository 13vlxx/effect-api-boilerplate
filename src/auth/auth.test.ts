import { PasswordHasher } from "#src/auth/application/ports/password.hasher.ts";
import { authenticateUser } from "#src/auth/application/use-cases/authenticate-user.use-case.ts";
import { registerUser } from "#src/auth/application/use-cases/register-user.use-case.ts";
import { UserRepository } from "#src/users/application/ports/user.repository.ts";
import { User, UserId, Username, type UserCredentials } from "#src/users/domain/user.entity.ts";
import { UsernameTakenError } from "#src/users/domain/user.errors.ts";
import { describe, expect, it } from "@effect/vitest";
import { DateTime, Effect, Layer, Option, Redacted } from "effect";

// Faux hacheur : rapide et lisible. On teste la logique des cas d'usage, pas Argon2.
const FakePasswordHasher = Layer.succeed(
  PasswordHasher,
  PasswordHasher.of({
    hash: (password) => Effect.succeed(Redacted.make(`hashed:${Redacted.value(password)}`)),
    verify: (password, hash) =>
      Effect.succeed(
        Option.isSome(hash) && Redacted.value(hash.value) === `hashed:${Redacted.value(password)}`,
      ),
  }),
);

const InMemoryUserRepository = Layer.effect(
  UserRepository,
  Effect.sync(() => {
    const store = new Map<string, UserCredentials>();
    return UserRepository.of({
      create: (username, passwordHash) =>
        Effect.suspend(() => {
          if (store.has(username)) {
            return Effect.fail(new UsernameTakenError({ message: "Username is already taken" }));
          }
          const user = new User({
            id: UserId.make(crypto.randomUUID()),
            username,
            createdAt: DateTime.nowUnsafe(),
          });
          store.set(user.username, { user, passwordHash });
          return Effect.succeed(user);
        }),
      findById: (id) =>
        Effect.sync(() =>
          Option.fromNullishOr([...store.values()].find((c) => c.user.id === id)?.user),
        ),
      findCredentials: (username) => Effect.sync(() => Option.fromNullishOr(store.get(username))),
    });
  }),
);

const TestLayer = Layer.mergeAll(InMemoryUserRepository, FakePasswordHasher);

const password = Redacted.make("correct horse battery");

describe("auth use cases", () => {
  it.effect("authenticates a registered user", () =>
    Effect.gen(function* () {
      const registered = yield* registerUser(Username.make("alice"), password);
      const user = yield* authenticateUser("alice", password);
      expect(user.id).toBe(registered.id);
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect("rejects a wrong password and an unknown user the same way", () =>
    Effect.gen(function* () {
      yield* registerUser(Username.make("alice"), password);
      const wrongPassword = yield* Effect.flip(authenticateUser("alice", Redacted.make("nope")));
      const unknownUser = yield* Effect.flip(authenticateUser("bob", password));
      expect(wrongPassword).toEqual(unknownUser);
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect("refuses a duplicate username", () =>
    Effect.gen(function* () {
      yield* registerUser(Username.make("alice"), password);
      const error = yield* Effect.flip(registerUser(Username.make("alice"), password));
      expect(error._tag).toBe("UsernameTakenError");
    }).pipe(Effect.provide(TestLayer)),
  );
});
