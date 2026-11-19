import { PostRepository } from "#src/posts/application/ports/post.repository.ts";
import type { PostId } from "#src/posts/domain/post.entity.ts";
import { PostNotFoundError } from "#src/posts/domain/post.errors.ts";
import { Effect } from "effect";

export const deletePost = Effect.fn("deletePost")(function* (id: PostId) {
  const postsRepository = yield* PostRepository;
  const deleted = yield* postsRepository.delete(id);
  if (!deleted) return yield* new PostNotFoundError({ id });
});
