import { UserId } from "#src/auth/domain/auth.entity.ts";
import { UserDirectory } from "#src/users/application/ports/user.directory.ts";
import { getUser } from "#src/users/application/use-cases/get-user.use-case.ts";
import { updateUserCustomData } from "#src/users/application/use-cases/update-user-custom-data.use-case.ts";
import { User } from "#src/users/domain/user.entity.ts";
import { DateTime, Effect, Layer, Option } from "effect";
import { describe, expect, it } from "@effect/vitest";

const alice = UserId.make("alice-sub");

const InMemoryUserDirectory = Layer.effect(
  UserDirectory,
  Effect.sync(() => {
    const store = new Map<UserId, User>([
      [
        alice,
        new User({
          id: alice,
          username: "alice",
          name: null,
          avatar: null,
          customData: {},
          createdAt: DateTime.nowUnsafe(),
        }),
      ],
    ]);
    return UserDirectory.of({
      findById: (id) => Effect.sync(() => Option.fromNullishOr(store.get(id))),
      updateCustomData: (id, patch) =>
        Effect.sync(() => {
          const current = store.get(id);
          if (current === undefined) return Option.none();
          const updated = new User({ ...current, customData: { ...current.customData, ...patch } });
          store.set(id, updated);
          return Option.some(updated);
        }),
    });
  }),
);

describe("users use cases", () => {
  it.effect("reads a user", () =>
    Effect.gen(function* () {
      const user = yield* getUser(alice);
      expect(user.username).toBe("alice");
    }).pipe(Effect.provide(InMemoryUserDirectory)),
  );

  it.effect("fails with UserNotFoundError on an unknown id", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(getUser(UserId.make("ghost")));
      expect(error._tag).toBe("UserNotFoundError");
    }).pipe(Effect.provide(InMemoryUserDirectory)),
  );

  it.effect("updates custom data then reads it back", () =>
    Effect.gen(function* () {
      yield* updateUserCustomData(alice, { bio: "Hello" });
      const user = yield* getUser(alice);
      expect(user.customData.bio).toBe("Hello");
    }).pipe(Effect.provide(InMemoryUserDirectory)),
  );

  it.effect("fails to update an unknown user", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(updateUserCustomData(UserId.make("ghost"), { bio: "x" }));
      expect(error._tag).toBe("UserNotFoundError");
    }).pipe(Effect.provide(InMemoryUserDirectory)),
  );
});
