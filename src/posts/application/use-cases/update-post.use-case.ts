import { PostRepository } from "#src/posts/application/ports/post.repository.ts";
import { getOwnedPost } from "#src/posts/application/use-cases/get-post.use-case.ts";
import type { PostId, PostPatch } from "#src/posts/domain/post.entity.ts";
import { PostNotFoundError } from "#src/posts/domain/post.errors.ts";
import type { UserId } from "#src/auth/domain/auth.entity.ts";
import { Effect } from "effect";

export const updatePost = Effect.fn("updatePost")(function* (
  actorId: UserId,
  id: PostId,
  data: PostPatch,
) {
  yield* getOwnedPost(actorId, id);
  const postsRepository = yield* PostRepository;
  const post = yield* postsRepository.update(id, data);
  return yield* Effect.fromOption(post, () => new PostNotFoundError({ id }));
});
