from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "Task Management System"
    APP_ENV: Literal["development", "staging", "production"] = "development"
    DEPLOYMENT_PREFIX: str = "/" if APP_ENV == "development" else "/api"

    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"

    CORS_ORIGINS: list[str] = Field(default_factory=list)


@lru_cache
def get_settings() -> Settings:
    return Settings()
