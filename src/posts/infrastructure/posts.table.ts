import { timestamp } from "drizzle-orm/cockroach-core";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const postsTable = pgTable("posts", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  content: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PostRow = typeof postsTable.$inferSelect;
