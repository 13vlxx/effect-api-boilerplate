import type { EffectPgDatabase } from "drizzle-orm/effect-pglite";
import { Context } from "effect";

export class Database extends Context.Service<Database, EffectPgDatabase>()("shared/Database") {}
