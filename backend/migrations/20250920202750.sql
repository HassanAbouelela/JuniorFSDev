-- Modify "users" table
ALTER TABLE "public"."users" ADD COLUMN "password_hash" character varying NOT NULL DEFAULT 'invalid';
