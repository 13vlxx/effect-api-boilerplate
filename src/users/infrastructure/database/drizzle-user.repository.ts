import { Database } from "#src/_shared/database/database.service.ts";
import { isUniqueViolation } from "#src/_shared/database/sql.errors.ts";
import { UserRepository } from "#src/users/application/ports/user.repository.ts";
import { User, UserId, Username } from "#src/users/domain/user.entity.ts";
import { UsernameTakenError } from "#src/users/domain/user.errors.ts";
import {
  USERS_USERNAME_UNIQUE,
  usersTable,
  type UserRow,
} from "#src/users/infrastructure/database/users.table.ts";
import { eq } from "drizzle-orm";
import { DateTime, Effect, Layer, Option, Redacted } from "effect";

const toUser = (row: UserRow): User =>
  new User({
    id: UserId.make(row.id),
    username: Username.make(row.username),
    createdAt: DateTime.fromDateUnsafe(row.createdAt),
  });

export const DrizzleUserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const db = yield* Database;

    const create = Effect.fn("UserRepository.create")(function* (
      username: Username,
      passwordHash: Redacted.Redacted<string>,
    ) {
      const rows = yield* db
        .insert(usersTable)
        .values({ username, passwordHash: Redacted.value(passwordHash) })
        .returning()
        .pipe(
          // Seul le doublon de username est une erreur métier ; le reste reste un défaut (500).
          Effect.catchTag("EffectDrizzleQueryError", (error) =>
            isUniqueViolation(error, USERS_USERNAME_UNIQUE)
              ? Effect.fail(new UsernameTakenError({ message: "Username is already taken" }))
              : Effect.die(error),
          ),
        );
      const row = rows[0];
      if (row === undefined) return yield* Effect.die("INSERT ... RETURNING returned no rows");
      return toUser(row);
    });

    const findById = Effect.fn("UserRepository.findById")(function* (id: UserId) {
      const rows = yield* db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .pipe(Effect.orDie);
      return Option.fromNullishOr(rows[0]).pipe(Option.map(toUser));
    });

    const findCredentials = Effect.fn("UserRepository.findCredentials")(function* (
      username: string,
    ) {
      const rows = yield* db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, username))
        .pipe(Effect.orDie);
      return Option.fromNullishOr(rows[0]).pipe(
        Option.map((row) => ({
          user: toUser(row),
          passwordHash: Redacted.make(row.passwordHash),
        })),
      );
    });

    return UserRepository.of({ create, findById, findCredentials });
  }),
);
