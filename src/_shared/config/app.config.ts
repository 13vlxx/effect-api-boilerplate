import { Config, Context, Effect, Layer, type Redacted } from "effect";

export class AppConfig extends Context.Service<
  AppConfig,
  {
    readonly port: number;
    readonly databaseUrl: Redacted.Redacted<string>;
    readonly jwtSecret: Redacted.Redacted<string>;
  }
>()("shared/AppConfig") {
  static readonly layer = Layer.effect(
    AppConfig,
    Effect.gen(function* () {
      const port = yield* Config.Port("PORT").pipe(Config.withDefault(3000));
      const databaseUrl = yield* Config.Redacted("DATABASE_URL");
      const jwtSecret = yield* Config.Redacted("JWT_SECRET");
      return AppConfig.of({
        port,
        databaseUrl,
        jwtSecret,
      });
    }),
  );
}
