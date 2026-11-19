import { Config, Context, Effect, Layer, type Redacted } from "effect";

export class AppConfig extends Context.Service<
  AppConfig,
  {
    readonly port: number;
    readonly databaseUrl: Redacted.Redacted<string>;
    readonly logtoEndpoint: string;
    readonly apiAudience: string;
    readonly logtoM2mClientId: string;
    readonly logtoM2mClientSecret: Redacted.Redacted<string>;
  }
>()("shared/AppConfig") {
  static readonly layer = Layer.effect(
    AppConfig,
    Effect.gen(function* () {
      const port = yield* Config.Port("PORT").pipe(Config.withDefault(3000));
      const databaseUrl = yield* Config.Redacted("DATABASE_URL");
      const logtoEndpoint = yield* Config.String("LOGTO_ENDPOINT");
      const apiAudience = yield* Config.String("API_AUDIENCE");
      const logtoM2mClientId = yield* Config.String("LOGTO_M2M_CLIENT_ID");
      const logtoM2mClientSecret = yield* Config.Redacted("LOGTO_M2M_CLIENT_SECRET");
      return AppConfig.of({
        port,
        databaseUrl,
        logtoEndpoint,
        apiAudience,
        logtoM2mClientId,
        logtoM2mClientSecret,
      });
    }),
  );
}
