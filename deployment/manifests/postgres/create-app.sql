-- 1. Create the role (user)
CREATE ROLE task_app WITH LOGIN PASSWORD '<password omitted>';

-- 2. Create the database owned by the new user
CREATE DATABASE task_app_db OWNER task_app;

-- 3. Revoke public access from the new database's schema
-- Connect to the new database
\c task_app_db
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- 4. Grant all privileges on the public schema to the user
GRANT ALL ON SCHEMA public TO task_app;

-- 5. Make sure the user can create and manage their own tables, etc.
GRANT ALL PRIVILEGES ON DATABASE task_app_db TO task_app;
