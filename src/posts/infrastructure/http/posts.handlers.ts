import type { PostRepository } from "#src/posts/application/ports/post.repository.ts";
import { createPost } from "#src/posts/application/use-cases/create-post.use-case.ts";
import { deletePost } from "#src/posts/application/use-cases/delete-post.use-case.ts";
import { getPost } from "#src/posts/application/use-cases/get-post.use-case.ts";
import { listPosts } from "#src/posts/application/use-cases/list-posts.use-case.ts";
import { updatePost } from "#src/posts/application/use-cases/update-post.use-case.ts";
import { Api } from "#src/_shared/http/api.ts";
import { CurrentUser } from "#src/auth/infrastructure/http/authentication.middleware.ts";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

export const PostsHandlersLive = HttpApiBuilder.group(Api, "posts", (handlers) =>
  Effect.gen(function* () {
    const ports = yield* Effect.context<PostRepository>();
    const run = Effect.provideContext(ports);
    return handlers.handleAll({
      list: () => run(listPosts()),
      getById: ({ params }) => run(getPost(params.id)),
      // CurrentUser est fourni à chaque requête par le middleware d'authentification.
      create: Effect.fn(function* ({ payload }) {
        const user = yield* CurrentUser;
        return yield* run(createPost(user.id, payload));
      }),
      update: Effect.fn(function* ({ params, payload }) {
        const user = yield* CurrentUser;
        return yield* run(updatePost(user.id, params.id, payload));
      }),
      delete: Effect.fn(function* ({ params }) {
        const user = yield* CurrentUser;
        return yield* run(deletePost(user.id, params.id));
      }),
    });
  }),
);
