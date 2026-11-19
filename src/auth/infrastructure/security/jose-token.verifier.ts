import { AppConfig } from "#src/_shared/config/app.config.ts";
import { TokenVerifier } from "#src/auth/application/ports/token.verifier.ts";
import { AuthUser, UserId } from "#src/auth/domain/auth.entity.ts";
import { UnauthorizedError } from "#src/auth/domain/auth.errors.ts";
import { createRemoteJWKSet, errors, jwtVerify } from "jose";
import { Data, Effect, Layer, Redacted } from "effect";

class TokenCheckFailed extends Data.TaggedError("TokenCheckFailed")<{ cause: unknown }> {}

export const JoseTokenVerifierLive = Layer.effect(
  TokenVerifier,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const issuer = `${config.logtoEndpoint}/oidc`;
    // jose met les clés en cache et les recharge quand un `kid` inconnu apparaît (rotation).
    const jwks = createRemoteJWKSet(new URL(`${issuer}/jwks`));

    const verify = Effect.fn("TokenVerifier.verify")(function* (token: Redacted.Redacted<string>) {
      const { payload } = yield* Effect.tryPromise({
        try: () => jwtVerify(Redacted.value(token), jwks, { issuer, audience: config.apiAudience }),
        // Un token invalide est une erreur métier ; Logto injoignable (JWKS) est une panne technique.
        catch: (cause) =>
          cause instanceof errors.JOSEError && !(cause instanceof errors.JWKSTimeout)
            ? new UnauthorizedError({ message: "Invalid or expired token" })
            : new TokenCheckFailed({ cause }),
      }).pipe(Effect.catchTag("TokenCheckFailed", Effect.die));
      if (payload.sub === undefined) {
        return yield* new UnauthorizedError({ message: "Invalid or expired token" });
      }
      return new AuthUser({ id: UserId.make(payload.sub) });
    });

    return TokenVerifier.of({ verify });
  }),
);
