import { Schema } from "effect";

// Message volontairement vague : on ne dit pas si c'est le username ou le mot de passe qui est faux.
export class UnauthorizedError extends Schema.TaggedError<UnauthorizedError>()(
  "UnauthorizedError",
  { message: Schema.String },
  { httpApiStatus: 401 },
) {}
