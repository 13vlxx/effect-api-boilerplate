import { Schema } from "effect";

export class UsernameTakenError extends Schema.TaggedError<UsernameTakenError>()(
  "UsernameTakenError",
  { message: Schema.String },
  { httpApiStatus: 409 },
) {}
