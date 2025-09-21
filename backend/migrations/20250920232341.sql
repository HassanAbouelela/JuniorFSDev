-- Modify "users" table
ALTER TABLE "public"."users" ADD COLUMN "is_admin" boolean NOT NULL DEFAULT false;
ALTER TABLE "public"."users" ALTER COLUMN "is_admin" DROP DEFAULT;
