import { AuthenticationLive } from "#src/auth/infrastructure/http/authentication.handler.ts";
import { JoseTokenVerifierLive } from "#src/auth/infrastructure/security/jose-token.verifier.ts";
import { Layer } from "effect";

// Middleware partagé par toutes les routes protégées, quel que soit leur module.
export const AuthMiddlewareLive = AuthenticationLive.pipe(Layer.provide(JoseTokenVerifierLive));
