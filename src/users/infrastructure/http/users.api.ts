import { Authentication } from "#src/auth/infrastructure/http/authentication.middleware.ts";
import { User, UserCustomDataPatch } from "#src/users/domain/user.entity.ts";
import { UserNotFoundError } from "#src/users/domain/user.errors.ts";
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

// Pas d'`:id` dans les routes : chacun ne voit et ne modifie que son propre profil.
export class UsersApi extends HttpApiGroup.make("users")
  .add(
    HttpApiEndpoint.get("me", "/me", { success: User, error: UserNotFoundError }).annotate(
      OpenApi.Summary,
      "Current User",
    ),
    HttpApiEndpoint.patch("updateMe", "/me", {
      payload: UserCustomDataPatch,
      success: User,
      error: UserNotFoundError,
    }).annotate(OpenApi.Summary, "Update Current User Custom Data"),
  )
  .middleware(Authentication)
  .prefix("/users") {}
