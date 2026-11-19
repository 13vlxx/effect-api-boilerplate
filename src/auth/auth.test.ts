import { PasswordHasher } from "#src/auth/application/ports/password.hasher.ts";
import { TokenService } from "#src/auth/application/ports/token.service.ts";
import { authenticateToken } from "#src/auth/application/use-cases/authenticate-token.use-case.ts";
import { loginUser } from "#src/auth/application/use-cases/login-user.use-case.ts";
import { AccessToken } from "#src/auth/domain/auth.entity.ts";
import { UnauthorizedError } from "#src/auth/domain/auth.errors.ts";
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

// Faux token : "token:<userId>". On teste la logique des cas d'usage, pas la signature JWT.
const FakeTokenService = Layer.succeed(
  TokenService,
  TokenService.of({
    issue: (userId) =>
      Effect.succeed(
        new AccessToken({ accessToken: `token:${userId}`, tokenType: "Bearer", expiresIn: 3600 }),
      ),
    verify: (token) => {
      const value = Redacted.value(token);
      return value.startsWith("token:")
        ? Effect.succeed(UserId.make(value.slice("token:".length)))
        : Effect.fail(new UnauthorizedError({ message: "Invalid or expired token" }));
    },
  }),
);

const TestLayer = Layer.mergeAll(InMemoryUserRepository, FakePasswordHasher, FakeTokenService);

const password = Redacted.make("correct horse battery");

describe("auth use cases", () => {
  it.effect("authenticates a registered user", () =>
    Effect.gen(function* () {
      const registered = yield* registerUser(Username.make("alice"), password);
      const registeredUser = yield* authenticateToken(Redacted.make(registered.accessToken));
      const user = yield* authenticateUser("alice", password);
      expect(user.id).toBe(registeredUser.id);
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

  it.effect("logs in and resolves the user from the issued token", () =>
    Effect.gen(function* () {
      const registered = yield* registerUser(Username.make("alice"), password);
      const { accessToken } = yield* loginUser("alice", password);
      const user = yield* authenticateToken(Redacted.make(accessToken));
      expect(accessToken).toBe(registered.accessToken);
      expect(user.username).toBe("alice");
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect("rejects a bad login, a bad token and a token of an unknown user", () =>
    Effect.gen(function* () {
      yield* registerUser(Username.make("alice"), password);
      const login = yield* Effect.flip(loginUser("alice", Redacted.make("nope")));
      const garbage = yield* Effect.flip(authenticateToken(Redacted.make("garbage")));
      const ghost = yield* Effect.flip(
        authenticateToken(Redacted.make(`token:${crypto.randomUUID()}`)),
      );
      expect([login._tag, garbage._tag, ghost._tag]).toEqual(Array(3).fill("UnauthorizedError"));
    }).pipe(Effect.provide(TestLayer)),
  );
});
