import { Api } from "#src/_shared/http/api.ts";
import type { PasswordHasher } from "#src/auth/application/ports/password.hasher.ts";
import { registerUser } from "#src/auth/application/use-cases/register-user.use-case.ts";
import { CurrentUser } from "#src/auth/infrastructure/http/authentication.middleware.ts";
import type { UserRepository } from "#src/users/application/ports/user.repository.ts";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

export const AuthHandlersLive = HttpApiBuilder.group(Api, "auth", (handlers) =>
  Effect.gen(function* () {
    const ports = yield* Effect.context<UserRepository | PasswordHasher>();
    return handlers.handleAll({
      register: ({ payload }) =>
        registerUser(payload.username, payload.password).pipe(Effect.provideContext(ports)),
      me: () => Effect.service(CurrentUser),
    });
  }),
);
