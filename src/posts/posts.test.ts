import { PostRepository } from "#src/posts/application/ports/post.repository.ts";
import { createPost } from "#src/posts/application/use-cases/create-post.use-case.ts";
import { deletePost } from "#src/posts/application/use-cases/delete-post.use-case.ts";
import { getPost } from "#src/posts/application/use-cases/get-post.use-case.ts";
import { Post, PostId } from "#src/posts/domain/post.entity.ts";
import { DateTime, Effect, Layer, Option } from "effect";
import { describe, expect, it } from "@effect/vitest";

const InMemoryPostRepository = Layer.effect(
  PostRepository,
  Effect.sync(() => {
    const store = new Map<PostId, Post>();
    return PostRepository.of({
      create: (input) =>
        Effect.sync(() => {
          const now = DateTime.nowUnsafe();
          const post = new Post({
            id: PostId.make(crypto.randomUUID()),
            ...input,
            createdAt: now,
            updatedAt: now,
          });
          store.set(post.id, post);
          return post;
        }),
      findById: (id) => Effect.sync(() => Option.fromNullishOr(store.get(id))),
      list: Effect.sync(() => [...store.values()]),
      update: (id, patch) =>
        Effect.sync(() => {
          const current = store.get(id);
          if (current === undefined) return Option.none();
          const updated = new Post({
            ...current,
            title: patch.title ?? current.title,
            content: patch.content ?? current.content,
          });
          store.set(id, updated);
          return Option.some(updated);
        }),
      delete: (id) => Effect.sync(() => store.delete(id)),
    });
  }),
);

describe("posts use cases", () => {
  it.effect("creates then reads a post", () =>
    Effect.gen(function* () {
      const created = yield* createPost({ title: "Hello", content: "World" });
      const found = yield* getPost(created.id);
      expect(found.title).toBe("Hello");
    }).pipe(Effect.provide(InMemoryPostRepository)),
  );

  it.effect("fails with PostNotFound on an unknown id", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(deletePost(PostId.make(crypto.randomUUID())));
      expect(error._tag).toBe("PostNotFoundError");
    }).pipe(Effect.provide(InMemoryPostRepository)),
  );
});
