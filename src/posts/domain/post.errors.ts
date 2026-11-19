import { PostId } from "#src/posts/domain/post.entity.ts";
import { Schema } from "effect";

export class PostNotFoundError extends Schema.TaggedError<PostNotFoundError>()(
  "PostNotFoundError",
  { id: PostId },
  { httpApiStatus: 404 },
) {}
