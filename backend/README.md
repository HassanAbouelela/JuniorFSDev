# Task Management Backend

This folder contains the source code for building and running the task management system backend.

It is built with fastapi, with SQLAlchemy as the ORM, PostgreSQL for DB, Agno for AI agent management, and Atlas for
migrations. A dockerfile is provided for building the image. Poetry is used for package management.

Use the [docker-compose.yml](../docker-compose.yml) to run locally at `http://localhost:8000`.
Docs at: http://localhost:8000/docs

## Configuration

| Key                  | Description                                                           | Type         | Default                               |
|----------------------|-----------------------------------------------------------------------|--------------|---------------------------------------|
| APP_NAME             | The application name shown in docs and elsewhere.                     | string       | Task Management System                |
| APP_ENV              | Deployment Environment (development, staging, production)             | string       | development                           |
| DEPLOYMENT_PREFIX    | Route prefix shown in docs (assumed to exist external to the app.     | string       | /api in production and staging.       |
| LOG_LEVEL            | Logging level for the application                                     | string       | DEBUG in development, INFO otherwise. |
| MOCK_AGENTS          | Use mocks for the agent tasks to assist with testing and development. | bool         | False                                 |
| JWT_KEY              | Signing key for JWT tokens. Generate with `openssl rand -hex 32`      | string       |                                       |
| JWT_ALGORITHM        |                                                                       | string       | HS256                                 |
| JWT_DURATION         | Maximum lifetime of access tokens.                                    | timedelta    | 15 minutes                            |
| JWT_REFRESH_DURATION | Maximum lifetime of refresh tokens.                                   | timedelta    | 7 days                                |
| DATABASE_URL         | Full URI to connect to the postgres database.                         | URI          |                                       |
| CORS_ORIGINS         | Allowed origin list for CORS.                                         | list[string] | `http://localhost:*` in development   |

Full configuration options are available in [app/config.py](./app/config.py).

## Atlas Migrations

Install atlas CLI from [here](https://atlasgo.io/docs), and install python dependencies:
`poetry install --with migrations`.
Once ready, use the atlas CLI to lint, generate, and apply migrations automatically.

- Generate migrations: `atlas migrate --env dev diff`
- Validate: `atlas migrate --env dev validate`
- Execute migrations: `atlas migrate --env dev apply`
- Check status: `atlas migrate --env dev status`
