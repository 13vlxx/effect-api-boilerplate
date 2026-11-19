import { PasswordHasher } from "#src/auth/application/ports/password.hasher.ts";
import { UnauthorizedError } from "#src/auth/domain/auth.errors.ts";
import { UserRepository } from "#src/users/application/ports/user.repository.ts";
import { Effect, Option, type Redacted } from "effect";

export const authenticateUser = Effect.fn("authenticateUser")(function* (
  username: string,
  password: Redacted.Redacted<string>,
) {
  const usersRepository = yield* UserRepository;
  const hasher = yield* PasswordHasher;
  const credentials = yield* usersRepository.findCredentials(username);
  // Toujours une vérification, même si le username est inconnu : le temps de réponse ne trahit rien.
  const valid = yield* hasher.verify(
    password,
    Option.map(credentials, (c) => c.passwordHash),
  );
  if (Option.isNone(credentials) || !valid) {
    // Même erreur, même message dans les deux cas.
    return yield* new UnauthorizedError({ message: "Invalid username or password" });
  }
  return credentials.value.user;
});
