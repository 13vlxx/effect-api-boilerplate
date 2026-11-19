import type { PasswordHasher } from "#src/auth/application/ports/password.hasher.ts";
import { authenticateUser } from "#src/auth/application/use-cases/authenticate-user.use-case.ts";
import {
  Authentication,
  CurrentUser,
} from "#src/auth/infrastructure/http/authentication.middleware.ts";
import type { UserRepository } from "#src/users/application/ports/user.repository.ts";
import { Effect, Layer } from "effect";

// Implémentation du middleware : vérifie l'en-tête Authorization: Basic à chaque requête protégée.
export const AuthenticationLive = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    // Un middleware ne peut rien réclamer par requête : on capture les ports une fois, ici.
    const ports = yield* Effect.context<UserRepository | PasswordHasher>();
    return Authentication.of({
      basic: Effect.fn("Authentication.basic")(function* (httpEffect, { credential }) {
        const user = yield* authenticateUser(credential.username, credential.password).pipe(
          Effect.provideContext(ports),
        );
        return yield* Effect.provideService(httpEffect, CurrentUser, user);
      }),
    });
  }),
);
