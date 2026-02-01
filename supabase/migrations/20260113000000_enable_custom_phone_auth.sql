-- Enable custom phone-based auth (MSG91) without relying on auth.users
-- 1) Remove FK dependency on auth.users so public.users can be managed independently
-- 2) Allow email to be nullable (phone-only accounts)
-- 3) Add password_hash column (used by forgot-password flow)
-- 4) Add default uuid for id and enforce unique phone

ALTER TABLE IF EXISTS "public"."users"
  DROP CONSTRAINT IF EXISTS "users_id_fkey";

ALTER TABLE IF EXISTS "public"."users"
  ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE IF EXISTS "public"."users"
  ALTER COLUMN "id" SET DEFAULT "extensions"."uuid_generate_v4"();

ALTER TABLE IF EXISTS "public"."users"
  ADD COLUMN IF NOT EXISTS "password_hash" character varying(255);

CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_unique"
  ON "public"."users" ("phone")
  WHERE "phone" IS NOT NULL;




