import { PostRepository } from "#src/posts/application/ports/post.repository.ts";
import type { PostId } from "#src/posts/domain/post.entity.ts";
import { PostNotFoundError } from "#src/posts/domain/post.errors.ts";
import { Effect } from "effect";

export const getPost = Effect.fn("getPost")(function* (id: PostId) {
  const postsRepository = yield* PostRepository;
  const post = yield* postsRepository.findById(id);
  return yield* Effect.fromOption(post, () => new PostNotFoundError({ id }));
});
