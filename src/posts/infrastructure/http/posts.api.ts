import { Authentication } from "#src/auth/infrastructure/http/authentication.middleware.ts";
import { Post, PostId, PostInput, PostPatch } from "#src/posts/domain/post.entity.ts";
import { PostForbiddenError, PostNotFoundError } from "#src/posts/domain/post.errors.ts";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

// Écriture réservée aux utilisateurs authentifiés, lecture publique.
export class PostsApi extends HttpApiGroup.make("posts")
  .add(
    HttpApiEndpoint.post("create", "/", {
      payload: PostInput,
      success: Post.pipe(HttpApiSchema.status(201)),
    }).annotate(OpenApi.Summary, "Create Post"),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: PostId },
      payload: PostPatch,
      success: Post,
      error: [PostNotFoundError, PostForbiddenError],
    }).annotate(OpenApi.Summary, "Update Post"),
    HttpApiEndpoint.delete("delete", "/:id", {
      params: { id: PostId },
      success: HttpApiSchema.NoContent,
      error: [PostNotFoundError, PostForbiddenError],
    }).annotate(OpenApi.Summary, "Delete Post"),
  )
  .middleware(Authentication)
  .add(
    HttpApiEndpoint.get("list", "/", { success: Schema.Array(Post) }).annotate(
      OpenApi.Summary,
      "List Posts",
    ),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: PostId },
      success: Post,
      error: PostNotFoundError,
    }).annotate(OpenApi.Summary, "Get Post"),
  )
  .prefix("/posts") {}
