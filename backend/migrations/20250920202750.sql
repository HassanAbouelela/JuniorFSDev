-- Modify "users" table
ALTER TABLE "public"."users" ADD COLUMN "password_hash" character varying DEFAULT 'invalid' NOT NULL;
ALTER TABLE "public"."users" ALTER COLUMN "password_hash" DROP DEFAULT;
