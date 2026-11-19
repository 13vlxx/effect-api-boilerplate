ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_users_id_fkey";--> statement-breakpoint
DROP TABLE "users";--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "author_id" SET DATA TYPE text USING "author_id"::text;