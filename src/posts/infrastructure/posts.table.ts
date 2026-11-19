import { usersTable } from "#src/users/infrastructure/database/users.table.ts";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const postsTable = pgTable("posts", {
  id: uuid().primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text().notNull(),
  content: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PostRow = typeof postsTable.$inferSelect;
