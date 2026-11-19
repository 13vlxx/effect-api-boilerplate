import { AuthHandlersLive } from "#src/auth/infrastructure/http/auth.handlers.ts";
import { AuthenticationLive } from "#src/auth/infrastructure/http/authentication.handler.ts";
import { Argon2PasswordHasherLive } from "#src/auth/infrastructure/security/argon2-password.hasher.ts";
import { UsersLive } from "#src/users/users.layer.ts";
import { Layer } from "effect";

// Les ports d'auth : le dépôt d'utilisateurs (module users) et le hacheur Argon2.
const AuthPortsLive = Layer.mergeAll(UsersLive, Argon2PasswordHasherLive);

// Routes /auth.
export const AuthLive = AuthHandlersLive.pipe(Layer.provide(AuthPortsLive));

// Middleware partagé par toutes les routes protégées, quel que soit leur module.
export const AuthMiddlewareLive = AuthenticationLive.pipe(Layer.provide(AuthPortsLive));
