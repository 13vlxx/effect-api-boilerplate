import { Schema } from "effect";

// Le seul endroit où le token apparaît en clair : la réponse de login, remise une fois au client.
export class AccessToken extends Schema.Class<AccessToken>("AccessToken")({
  accessToken: Schema.String,
  tokenType: Schema.Literal("Bearer"),
  // Durée de validité en secondes.
  expiresIn: Schema.Finite,
}) {}
