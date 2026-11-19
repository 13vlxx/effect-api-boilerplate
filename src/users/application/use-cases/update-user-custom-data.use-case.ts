import type { UserId } from "#src/auth/domain/auth.entity.ts";
import { UserDirectory } from "#src/users/application/ports/user.directory.ts";
import type { UserCustomDataPatch } from "#src/users/domain/user.entity.ts";
import { UserNotFoundError } from "#src/users/domain/user.errors.ts";
import { Effect } from "effect";

// On ne modifie que soi-même : l'acteur est aussi la cible.
export const updateUserCustomData = Effect.fn("updateUserCustomData")(function* (
  actorId: UserId,
  patch: UserCustomDataPatch,
) {
  const users = yield* UserDirectory;
  const user = yield* users.updateCustomData(actorId, patch);
  return yield* Effect.fromOption(user, () => new UserNotFoundError({ id: actorId }));
});
