import type { TokenService } from "#src/auth/application/ports/token.service.ts";
import { authenticateToken } from "#src/auth/application/use-cases/authenticate-token.use-case.ts";
import {
  Authentication,
  CurrentUser,
} from "#src/auth/infrastructure/http/authentication.middleware.ts";
import type { UserRepository } from "#src/users/application/ports/user.repository.ts";
import { Effect, Layer } from "effect";

// Implémentation du middleware : vérifie l'en-tête Authorization: Bearer à chaque requête protégée.
export const AuthenticationLive = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    // Un middleware ne peut rien réclamer par requête : on capture les ports une fois, ici.
    const ports = yield* Effect.context<UserRepository | TokenService>();
    return Authentication.of({
      bearer: Effect.fn("Authentication.bearer")(function* (httpEffect, { credential }) {
        const user = yield* authenticateToken(credential).pipe(Effect.provideContext(ports));
        return yield* Effect.provideService(httpEffect, CurrentUser, user);
      }),
    });
  }),
);
