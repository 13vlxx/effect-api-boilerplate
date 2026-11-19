import type { EffectPgDatabase } from "drizzle-orm/effect-postgres";
import { Context } from "effect";

export class Database extends Context.Service<Database, EffectPgDatabase>()("shared/Database") {}
