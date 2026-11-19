import { PostRepository } from "#src/posts/application/ports/post.repository.ts";
import type { PostId } from "#src/posts/domain/post.entity.ts";
import { PostForbiddenError, PostNotFoundError } from "#src/posts/domain/post.errors.ts";
import type { UserId } from "#src/auth/domain/auth.entity.ts";
import { Effect } from "effect";

export const getPost = Effect.fn("getPost")(function* (id: PostId) {
  const postRepository = yield* PostRepository;
  const post = yield* postRepository.findById(id);
  return yield* Effect.fromOption(post, () => new PostNotFoundError({ id }));
});

// Règle métier partagée par update et delete : seul l'auteur modifie ou supprime son post.
export const getOwnedPost = Effect.fn("getOwnedPost")(function* (actorId: UserId, id: PostId) {
  const post = yield* getPost(id);
  if (post.authorId !== actorId) {
    return yield* new PostForbiddenError({ message: "Only the author can change this post" });
  }
  return post;
});
