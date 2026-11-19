import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/_shared/database/schema.ts",
  out: "./drizzle",
  // Seulement utile à `db:studio` ; `db:generate` n'ouvre pas de connexion.
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
