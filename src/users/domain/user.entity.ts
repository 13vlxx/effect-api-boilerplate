import { type Redacted, Schema } from "effect";

export const UserId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

export const Username = Schema.String.check(
  Schema.isMinLength(3),
  Schema.isMaxLength(30),
  Schema.isPattern(/^[a-z0-9_]+$/, { message: "Only lowercase letters, digits and underscores" }),
).pipe(Schema.brand("Username"));
export type Username = typeof Username.Type;

export const Password = Schema.String.check(Schema.isMinLength(12), Schema.isMaxLength(128));

export class User extends Schema.Class<User>("User")({
  id: UserId,
  username: Username,
  createdAt: Schema.DateTimeUtc,
}) {}

export interface UserCredentials {
  readonly user: User;
  readonly passwordHash: Redacted.Redacted;
}
