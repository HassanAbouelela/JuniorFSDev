-- Create enum type "agenttype"
CREATE TYPE "public"."agenttype" AS ENUM ('analyzer', 'assistant');
-- Create enum type "taskpriority"
CREATE TYPE "public"."taskpriority" AS ENUM ('high', 'medium', 'low');
-- Create enum type "taskstatus"
CREATE TYPE "public"."taskstatus" AS ENUM ('pending', 'in_progress', 'completed');
-- Create "users" table
CREATE TABLE "public"."users" (
  "id" uuid NOT NULL,
  "name" character varying(100) NOT NULL,
  "email" character varying(255) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, CURRENT_TIMESTAMP),
  PRIMARY KEY ("id")
);
-- Create index "ix_users_email" to table: "users"
CREATE UNIQUE INDEX "ix_users_email" ON "public"."users" ("email");
-- Create index "ix_users_id" to table: "users"
CREATE INDEX "ix_users_id" ON "public"."users" ("id");
-- Create "tasks" table
CREATE TABLE "public"."tasks" (
  "id" uuid NOT NULL,
  "title" character varying(100) NOT NULL,
  "description" text NOT NULL,
  "priority" "public"."taskpriority" NOT NULL,
  "status" "public"."taskstatus" NOT NULL,
  "deadline" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, CURRENT_TIMESTAMP),
  "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, CURRENT_TIMESTAMP),
  "user_id" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "ix_tasks_id" to table: "tasks"
CREATE INDEX "ix_tasks_id" ON "public"."tasks" ("id");
-- Create "agent_responses" table
CREATE TABLE "public"."agent_responses" (
  "id" uuid NOT NULL,
  "agent_type" "public"."agenttype" NOT NULL,
  "response_data" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, CURRENT_TIMESTAMP),
  "task_id" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "agent_responses_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "ix_agent_responses_id" to table: "agent_responses"
CREATE INDEX "ix_agent_responses_id" ON "public"."agent_responses" ("id");
