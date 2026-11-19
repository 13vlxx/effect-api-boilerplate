import { PostRepository } from "#src/posts/application/ports/post.repository.ts";
import type { PostInput } from "#src/posts/domain/post.entity.ts";
import type { UserId } from "#src/users/domain/user.entity.ts";
import { Effect } from "effect";

// L'auteur vient de l'utilisateur authentifié, jamais du corps de la requête.
export const createPost = Effect.fn("createPost")(function* (authorId: UserId, data: PostInput) {
  const postsRepository = yield* PostRepository;
  return yield* postsRepository.create({ authorId, ...data });
});
