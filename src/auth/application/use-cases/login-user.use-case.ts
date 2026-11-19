import { TokenService } from "#src/auth/application/ports/token.service.ts";
import { authenticateUser } from "#src/auth/application/use-cases/authenticate-user.use-case.ts";
import { Effect, type Redacted } from "effect";

export const loginUser = Effect.fn("loginUser")(function* (
  username: string,
  password: Redacted.Redacted<string>,
) {
  const user = yield* authenticateUser(username, password);
  const tokens = yield* TokenService;
  return yield* tokens.issue(user.id);
});
