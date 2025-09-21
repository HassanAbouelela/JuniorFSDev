-- Create "task_readers" table
CREATE TABLE "public"."task_readers" (
  "task_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  PRIMARY KEY ("task_id", "user_id"),
  CONSTRAINT "task_readers_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "task_readers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
