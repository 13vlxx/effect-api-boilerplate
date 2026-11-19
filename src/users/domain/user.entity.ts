import { UserId } from "#src/auth/domain/auth.entity.ts";
import { Schema } from "effect";

export const UserBio = Schema.String.check(Schema.isTrimmed(), Schema.isMaxLength(280));

// Les `customData` de Logto, typées ici : ajouter un champ ne demande que de toucher ce schéma.
const customDataFields = { bio: Schema.optional(UserBio) };

export const UserCustomData = Schema.Struct(customDataFields);
export type UserCustomData = typeof UserCustomData.Type;

// Logto fusionne le patch avec l'existant : même forme, tous les champs sont optionnels.
export const UserCustomDataPatch = Schema.Struct(customDataFields);
export type UserCustomDataPatch = typeof UserCustomDataPatch.Type;

export class User extends Schema.Class<User>("User")({
  id: UserId,
  username: Schema.NullOr(Schema.String),
  name: Schema.NullOr(Schema.String),
  avatar: Schema.NullOr(Schema.String),
  customData: UserCustomData,
  createdAt: Schema.DateTimeUtc,
}) {}
