import { PostId } from "#src/posts/domain/post.entity.ts";
import { Schema } from "effect";

export class PostNotFoundError extends Schema.TaggedError<PostNotFoundError>()(
  "PostNotFoundError",
  { id: PostId },
  { httpApiStatus: 404 },
) {}

export class PostForbiddenError extends Schema.TaggedError<PostForbiddenError>()(
  "PostForbiddenError",
  { message: Schema.String },
  { httpApiStatus: 403 },
) {}
