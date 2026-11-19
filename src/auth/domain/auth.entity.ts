import { Schema } from "effect";

// Le `sub` du token Logto : une chaîne opaque, pas un UUID.
export const UserId = Schema.String.check(Schema.isMinLength(1)).pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

// Ce que l'API sait de l'appelant, tiré uniquement du token.
export class AuthUser extends Schema.Class<AuthUser>("AuthUser")({ id: UserId }) {}
