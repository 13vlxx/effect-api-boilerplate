import { TokenService } from "#src/auth/application/ports/token.service.ts";
import { UnauthorizedError } from "#src/auth/domain/auth.errors.ts";
import { UserRepository } from "#src/users/application/ports/user.repository.ts";
import { Effect, type Redacted } from "effect";

export const authenticateToken = Effect.fn("authenticateToken")(function* (
  token: Redacted.Redacted<string>,
) {
  const tokens = yield* TokenService;
  const usersRepository = yield* UserRepository;
  const userId = yield* tokens.verify(token);
  // Un token encore valide pour un utilisateur supprimé doit être refusé.
  const user = yield* usersRepository.findById(userId);
  return yield* Effect.fromOption(
    user,
    () => new UnauthorizedError({ message: "Invalid or expired token" }),
  );
});
