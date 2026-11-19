import { AppConfig } from "#src/shared/config/app.config.ts";
import { Database } from "#src/shared/database/database.service.ts";
import { PgClient } from "@effect/sql-pg";
import { makeWithDefaults } from "drizzle-orm/effect-pglite";
import { Effect, Layer } from "effect";

const PgLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* AppConfig;
    return PgClient.layer({ url: config.databaseUrl });
  }),
);

export const DatabaseLive = Layer.effect(Database, makeWithDefaults()).pipe(Layer.provide(PgLive));
