import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/_shared/database/schema.ts",
  out: "./drizzle",
});
