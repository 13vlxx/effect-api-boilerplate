import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Nom de contrainte explicite : l'adaptateur s'en sert pour reconnaître un doublon.
export const USERS_USERNAME_UNIQUE = "users_username_unique";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  username: text().notNull().unique(USERS_USERNAME_UNIQUE),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof usersTable.$inferSelect;
