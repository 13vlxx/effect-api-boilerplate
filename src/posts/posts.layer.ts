import { DrizzlePostRepositoryLive } from "#src/posts/infrastructure/database/drizzle-post.repository.ts";
import { PostsHandlersLive } from "#src/posts/infrastructure/http/posts.handlers.ts";
import { Layer } from "effect";

export const PostsLive = PostsHandlersLive.pipe(Layer.provide(DrizzlePostRepositoryLive));
