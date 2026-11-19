import { Post, PostId, PostInput, PostPatch } from "#src/posts/domain/post.entity.ts";
import { PostNotFoundError } from "#src/posts/domain/post.errors.ts";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";

export class PostsApi extends HttpApiGroup.make("posts")
  .add(
    HttpApiEndpoint.get("list", "/", { success: Schema.Array(Post) }),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: PostId },
      success: Post,
      error: PostNotFoundError,
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: PostInput,
      success: Post.pipe(HttpApiSchema.status(201)),
    }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: PostId },
      payload: PostPatch,
      success: Post,
      error: PostNotFoundError,
    }),
    HttpApiEndpoint.delete("delete", "/:id", {
      params: { id: PostId },
      success: HttpApiSchema.NoContent,
      error: PostNotFoundError,
    }),
  )
  .prefix("/posts") {}
