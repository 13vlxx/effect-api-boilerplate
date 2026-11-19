import type { UserId } from "#src/auth/domain/auth.entity.ts";
import { UserDirectory } from "#src/users/application/ports/user.directory.ts";
import { UserNotFoundError } from "#src/users/domain/user.errors.ts";
import { Effect } from "effect";

export const getUser = Effect.fn("getUser")(function* (id: UserId) {
  const users = yield* UserDirectory;
  const user = yield* users.findById(id);
  return yield* Effect.fromOption(user, () => new UserNotFoundError({ id }));
});
