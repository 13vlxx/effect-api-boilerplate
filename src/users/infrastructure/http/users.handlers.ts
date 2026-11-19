import { Api } from "#src/_shared/http/api.ts";
import { CurrentUser } from "#src/auth/infrastructure/http/authentication.middleware.ts";
import type { UserDirectory } from "#src/users/application/ports/user.directory.ts";
import { getUser } from "#src/users/application/use-cases/get-user.use-case.ts";
import { updateUserCustomData } from "#src/users/application/use-cases/update-user-custom-data.use-case.ts";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

export const UsersHandlersLive = HttpApiBuilder.group(Api, "users", (handlers) =>
  Effect.gen(function* () {
    const ports = yield* Effect.context<UserDirectory>();
    const run = Effect.provideContext(ports);
    return handlers.handleAll({
      me: Effect.fn(function* () {
        const user = yield* CurrentUser;
        return yield* run(getUser(user.id));
      }),
      updateMe: Effect.fn(function* ({ payload }) {
        const user = yield* CurrentUser;
        return yield* run(updateUserCustomData(user.id, payload));
      }),
    });
  }),
);
