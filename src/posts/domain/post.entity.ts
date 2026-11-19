import { Schema } from "effect";

export const PostId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand("PostId"));
export type PostId = typeof PostId.Type;

export const PostTitle = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isMinLength(1),
  Schema.isMaxLength(30),
);
export const PostContent = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isMinLength(1),
  Schema.isMaxLength(255),
);

export const PostInput = Schema.Struct({
  title: PostTitle,
  content: PostContent,
});
export type PostInput = typeof PostInput.Type;

export const PostPatch = Schema.Struct({
  title: Schema.optional(PostTitle),
  content: Schema.optional(PostContent),
});
export type PostPatch = typeof PostPatch.Type;

export class Post extends Schema.Class<Post>("Post")({
  id: PostId,
  title: PostTitle,
  content: PostContent,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
}) {}
