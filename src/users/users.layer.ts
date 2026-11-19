import { LogtoUserDirectoryLive } from "#src/users/infrastructure/logto/logto-user.directory.ts";
import { UsersHandlersLive } from "#src/users/infrastructure/http/users.handlers.ts";
import { FetchHttpClient } from "effect/http";
import { Layer } from "effect";

export const UsersLive = UsersHandlersLive.pipe(
  Layer.provide(LogtoUserDirectoryLive),
  Layer.provide(FetchHttpClient.layer),
);
