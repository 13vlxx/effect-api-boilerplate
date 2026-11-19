import { PasswordHasher } from "#src/auth/application/ports/password.hasher.ts";
import { TokenService } from "#src/auth/application/ports/token.service.ts";
import { UserRepository } from "#src/users/application/ports/user.repository.ts";
import type { Username } from "#src/users/domain/user.entity.ts";
import { Effect, type Redacted } from "effect";

// Le mot de passe n'est jamais stocké : seul son hash part vers le repository.
export const registerUser = Effect.fn("registerUser")(function* (
  username: Username,
  password: Redacted.Redacted<string>,
) {
  const hasher = yield* PasswordHasher;
  const usersRepository = yield* UserRepository;
  const passwordHash = yield* hasher.hash(password);
  const user = yield* usersRepository.create(username, passwordHash);
  const tokens = yield* TokenService;
  return yield* tokens.issue(user.id);
});
