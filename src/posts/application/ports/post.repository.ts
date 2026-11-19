import type { Post, PostId, PostInput, PostPatch } from "#src/posts/domain/post.entity.ts";
import { Context, Effect, Option } from "effect";

export class PostRepository extends Context.Service<
  PostRepository,
  {
    readonly create: (data: PostInput) => Effect.Effect<Post>;
    readonly findById: (id: PostId) => Effect.Effect<Option.Option<Post>>;
    readonly list: Effect.Effect<ReadonlyArray<Post>>;
    readonly update: (id: PostId, data: PostPatch) => Effect.Effect<Option.Option<Post>>;
    readonly delete: (id: PostId) => Effect.Effect<boolean>;
  }
>()("posts/PostRepository") {}
