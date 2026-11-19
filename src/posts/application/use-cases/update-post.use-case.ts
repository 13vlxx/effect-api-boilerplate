import { PostRepository } from "#src/posts/application/ports/post.repository.ts";
import type { PostId, PostPatch } from "#src/posts/domain/post.entity.ts";
import { PostNotFoundError } from "#src/posts/domain/post.errors.ts";
import { Effect } from "effect";

export const updatePost = Effect.fn("updatePost")(function* (id: PostId, data: PostPatch) {
  const postsRepository = yield* PostRepository;
  const post = yield* postsRepository.update(id, data);
  return yield* Effect.fromOption(post, () => new PostNotFoundError({ id }));
});
