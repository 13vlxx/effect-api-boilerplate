import type { User, UserCredentials, UserId, Username } from "#src/users/domain/user.entity.ts";
import type { UsernameTakenError } from "#src/users/domain/user.errors.ts";
import { Context, Effect, type Redacted, Option } from "effect";

export class UserRepository extends Context.Service<
  UserRepository,
  {
    readonly create: (
      username: Username,
      passwordHash: Redacted.Redacted<string>,
    ) => Effect.Effect<User, UsernameTakenError>;
    readonly findById: (id: UserId) => Effect.Effect<Option.Option<User>>;
    readonly findCredentails: (username: string) => Effect.Effect<Option.Option<UserCredentials>>;
  }
>()("UserRepository") {}
