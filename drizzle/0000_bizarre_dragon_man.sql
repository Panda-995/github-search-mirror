CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."user_role" AS ENUM ('USER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "github_token" text,
  "password_hash" text,
  "email" varchar(255),
  "name" varchar(255),
  "avatar" text,
  "role" "public"."user_role" DEFAULT 'USER',
  "ai_config" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "users_email_unique" UNIQUE("email")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "collections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "is_public" boolean DEFAULT false,
  "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
  "created_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "repo_full_name" varchar(255) NOT NULL,
  "repo_meta" jsonb,
  "note" text,
  "collection_id" uuid NOT NULL REFERENCES "public"."collections"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
  "created_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "query" text NOT NULL,
  "filters" jsonb,
  "user_id" uuid REFERENCES "public"."users"("id") ON DELETE cascade,
  "created_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "repo_full_name" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "rating" integer,
  "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
  "parent_id" uuid REFERENCES "public"."comments"("id") ON DELETE cascade,
  "is_pinned" boolean DEFAULT false,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "public"."user_role" DEFAULT 'USER';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ai_config" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN IF NOT EXISTS "repo_meta" jsonb;--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN IF NOT EXISTS "note" text;--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "search_history" ADD COLUMN IF NOT EXISTS "filters" jsonb;--> statement-breakpoint
ALTER TABLE "search_history" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "rating" integer;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "is_pinned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
UPDATE "comments" SET "is_pinned" = false WHERE "is_pinned" IS NULL;--> statement-breakpoint
UPDATE "comments" SET "is_deleted" = false WHERE "is_deleted" IS NULL;--> statement-breakpoint
UPDATE "comments" SET "created_at" = now() WHERE "created_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collections_user_id_idx" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_repo_full_name_idx" ON "comments" USING btree ("repo_full_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favorites_user_id_idx" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favorites_collection_id_idx" ON "favorites" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_history_user_id_idx" ON "search_history" USING btree ("user_id");
