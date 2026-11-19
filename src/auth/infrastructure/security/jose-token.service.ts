import { AppConfig } from "#src/_shared/config/app.config.ts";
import { TokenService } from "#src/auth/application/ports/token.service.ts";
import { AccessToken } from "#src/auth/domain/auth.entity.ts";
import { UnauthorizedError } from "#src/auth/domain/auth.errors.ts";
import { UserId } from "#src/users/domain/user.entity.ts";
import { errors, jwtVerify, SignJWT } from "jose";
import { Data, Effect, Layer, Redacted } from "effect";

const ISSUER = "effect-api";
const TTL_SECONDS = 60 * 60;
// HS256 exige au moins 256 bits de secret.
const MIN_SECRET_LENGTH = 32;

class TokenCheckFailed extends Data.TaggedError("TokenCheckFailed")<{ cause: unknown }> {}

export const JoseTokenServiceLive = Layer.effect(
  TokenService,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const secret = Redacted.value(config.jwtSecret);
    if (secret.length < MIN_SECRET_LENGTH) {
      return yield* Effect.die(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
    }
    const key = new TextEncoder().encode(secret);

    const issue = Effect.fn("TokenService.issue")(function* (userId: UserId) {
      const token = yield* Effect.promise(() =>
        new SignJWT()
          .setProtectedHeader({ alg: "HS256" })
          .setSubject(userId)
          .setIssuer(ISSUER)
          .setIssuedAt()
          .setExpirationTime(`${TTL_SECONDS}s`)
          .sign(key),
      );
      return new AccessToken({ accessToken: token, tokenType: "Bearer", expiresIn: TTL_SECONDS });
    });

    const verify = Effect.fn("TokenService.verify")(function* (token: Redacted.Redacted<string>) {
      const { payload } = yield* Effect.tryPromise({
        // L'algorithme est figé : on refuse un token qui en annonce un autre (ex. `none`).
        try: () => jwtVerify(Redacted.value(token), key, { issuer: ISSUER, algorithms: ["HS256"] }),
        // Un token invalide est une erreur métier ; tout autre échec est un bug.
        catch: (cause) =>
          cause instanceof errors.JOSEError
            ? new UnauthorizedError({ message: "Invalid or expired token" })
            : new TokenCheckFailed({ cause }),
      }).pipe(Effect.catchTag("TokenCheckFailed", Effect.die));
      if (payload.sub === undefined) {
        return yield* new UnauthorizedError({ message: "Invalid or expired token" });
      }
      return UserId.make(payload.sub);
    });

    return TokenService.of({ issue, verify });
  }),
);
