import { UserId } from "#src/auth/domain/auth.entity.ts";
import { Schema } from "effect";

export class UserNotFoundError extends Schema.TaggedError<UserNotFoundError>()(
  "UserNotFoundError",
  { id: UserId },
  { httpApiStatus: 404 },
) {}
