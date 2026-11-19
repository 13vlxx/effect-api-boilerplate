import { PostRepository } from "#src/posts/application/ports/post.repository.ts";
import type { PostInput } from "#src/posts/domain/post.entity.ts";
import { Effect } from "effect";

export const createPost = Effect.fn("createPost")(function* (data: PostInput) {
  const postsRepository = yield* PostRepository;
  return yield* postsRepository.create(data);
});
