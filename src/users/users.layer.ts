import { DrizzleUserRepositoryLive } from "#src/users/infrastructure/database/drizzle-user.repository.ts";

// users n'a pas de routes : il publie seulement l'implémentation de son port, pour auth.
export const UsersLive = DrizzleUserRepositoryLive;
