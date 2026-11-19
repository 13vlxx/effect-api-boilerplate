import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const postsTable = pgTable("posts", {
  id: uuid().primaryKey().defaultRandom(),
  // Le `sub` Logto : les utilisateurs ne sont pas dans notre base, donc pas de clé étrangère.
  authorId: text("author_id").notNull(),
  title: text().notNull(),
  content: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PostRow = typeof postsTable.$inferSelect;
