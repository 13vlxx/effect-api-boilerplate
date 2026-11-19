import type { UserId } from "#src/auth/domain/auth.entity.ts";
import type { User, UserCustomDataPatch } from "#src/users/domain/user.entity.ts";
import { Context, type Effect, type Option } from "effect";

// L'annuaire des utilisateurs : ils vivent chez Logto, l'API ne les stocke pas.
export class UserDirectory extends Context.Service<
  UserDirectory,
  {
    readonly findById: (id: UserId) => Effect.Effect<Option.Option<User>>;
    readonly updateCustomData: (
      id: UserId,
      patch: UserCustomDataPatch,
    ) => Effect.Effect<Option.Option<User>>;
  }
>()("users/UserDirectory") {}
