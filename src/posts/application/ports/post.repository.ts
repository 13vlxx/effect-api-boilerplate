import type { Post, PostId, PostInput, PostPatch } from "#src/posts/domain/post.entity.ts";
import type { UserId } from "#src/auth/domain/auth.entity.ts";
import { Context, type Effect, type Option } from "effect";

// Ce que le dépôt enregistre : les champs saisis, plus l'auteur, qui ne vient jamais du client.
export interface NewPost extends PostInput {
  readonly authorId: UserId;
}

export class PostRepository extends Context.Service<
  PostRepository,
  {
    readonly create: (data: NewPost) => Effect.Effect<Post>;
    readonly findById: (id: PostId) => Effect.Effect<Option.Option<Post>>;
    readonly list: Effect.Effect<ReadonlyArray<Post>>;
    readonly update: (id: PostId, data: PostPatch) => Effect.Effect<Option.Option<Post>>;
    readonly delete: (id: PostId) => Effect.Effect<boolean>;
  }
>()("posts/PostRepository") {}
