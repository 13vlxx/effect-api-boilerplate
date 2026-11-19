import { Database } from "#src/_shared/database/database.service.ts";
import { PostRepository, type NewPost } from "#src/posts/application/ports/post.repository.ts";
import { Post, PostId, type PostPatch } from "#src/posts/domain/post.entity.ts";
import { postsTable, type PostRow } from "#src/posts/infrastructure/posts.table.ts";
import { UserId } from "#src/auth/domain/auth.entity.ts";
import { eq } from "drizzle-orm";
import { DateTime, Effect, Layer, Option } from "effect";

const toPost = (row: PostRow): Post =>
  new Post({
    id: PostId.make(row.id),
    authorId: UserId.make(row.authorId),
    title: row.title,
    content: row.content,
    createdAt: DateTime.fromDateUnsafe(row.createdAt),
    updatedAt: DateTime.fromDateUnsafe(row.updatedAt),
  });

export const DrizzlePostRepositoryLive = Layer.effect(
  PostRepository,
  Effect.gen(function* () {
    const db = yield* Database;

    const create = Effect.fn("PostRepository.create")(function* (data: NewPost) {
      const rows = yield* db.insert(postsTable).values(data).returning().pipe(Effect.orDie);
      const row = rows[0];

      if (row === undefined) return yield* Effect.die("INSERT ... RETURNING returned no rows");

      return toPost(row);
    });

    const findById = Effect.fn("PostRepository.findById")(function* (id: PostId) {
      const rows = yield* db
        .select()
        .from(postsTable)
        .where(eq(postsTable.id, id))
        .pipe(Effect.orDie);
      return Option.fromNullishOr(rows[0]).pipe(Option.map(toPost));
    });

    const list = db
      .select()
      .from(postsTable)
      .pipe(
        Effect.orDie,
        Effect.map((rows) => rows.map(toPost)),
        Effect.withSpan("PostRepository.list"),
      );

    const update = Effect.fn("PostRepository.update")(function* (id: PostId, data: PostPatch) {
      const rows = yield* db
        .update(postsTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(postsTable.id, id))
        .returning()
        .pipe(Effect.orDie);
      return Option.fromNullishOr(rows[0]).pipe(Option.map(toPost));
    });

    const del = Effect.fn("PostRepository.delete")(function* (id: PostId) {
      const rows = yield* db
        .delete(postsTable)
        .where(eq(postsTable.id, id))
        .returning({ id: postsTable.id })
        .pipe(Effect.orDie);
      return rows.length > 0;
    });

    return PostRepository.of({ create, findById, list, update, delete: del });
  }),
);
