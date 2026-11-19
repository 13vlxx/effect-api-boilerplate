import { PostRepository } from "#src/posts/application/ports/post.repository.ts";
import { getOwnedPost } from "#src/posts/application/use-cases/get-post.use-case.ts";
import type { PostId } from "#src/posts/domain/post.entity.ts";
import { PostNotFoundError } from "#src/posts/domain/post.errors.ts";
import type { UserId } from "#src/users/domain/user.entity.ts";
import { Effect } from "effect";

export const deletePost = Effect.fn("deletePost")(function* (actorId: UserId, id: PostId) {
  yield* getOwnedPost(actorId, id);
  const postsRepository = yield* PostRepository;
  const deleted = yield* postsRepository.delete(id);
  if (!deleted) return yield* new PostNotFoundError({ id });
});
