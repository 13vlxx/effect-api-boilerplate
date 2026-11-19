import { AppConfig } from "#src/shared/config/app.config.ts";
import { DatabaseLive } from "#src/shared/database/database.layer.ts";
import { Database } from "#src/shared/database/database.service.ts";
import { NodeRuntime } from "@effect/platform-node";
import { migrate } from "drizzle-orm/effect-postgres/migrator";
import { Effect, Layer } from "effect";
import { fileURLToPath } from "node:url";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

const program = Effect.gen(function* () {
  const db = yield* Database;
  yield* migrate(db, { migrationsFolder });
  yield* Effect.logInfo("Migrations applied successfully");
});

program.pipe(
  Effect.provide(DatabaseLive.pipe(Layer.provide(AppConfig.layer))),
  NodeRuntime.runMain,
);
