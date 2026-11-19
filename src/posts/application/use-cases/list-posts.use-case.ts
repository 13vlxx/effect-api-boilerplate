import { PostRepository } from "#src/posts/application/ports/post.repository.ts";
import { Effect } from "effect";

export const listPosts = Effect.fn("listPosts")(function* () {
  const postsRepository = yield* PostRepository;
  return yield* postsRepository.list;
});
