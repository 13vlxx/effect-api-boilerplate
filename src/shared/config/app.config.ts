import { Config, Context, Effect, Layer, Redacted } from "effect";

export class AppConfig extends Context.Service<
  AppConfig,
  {
    readonly port: number;
    readonly databaseUrl: Redacted.Redacted<string>;
  }
>()("shared/AppConfig") {
  static readonly layer = Layer.effect(
    AppConfig,
    Effect.gen(function* () {
      const port = yield* Config.Port("PORT").pipe(Config.withDefault(3000));
      const databaseUrl = yield* Config.Redacted("DATABASE_URL");
      return AppConfig.of({
        port,
        databaseUrl,
      });
    }),
  );
}
