import datetime
import logging
import os
from functools import lru_cache
from typing import Literal, Self

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_JWT_KEY = "00744ab51d9610de365af2757ba8c1a981c1853520f3e48e69c91001b8faa6be"

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "Task Management System"
    APP_ENV: Literal["development", "staging", "production"] = "development"
    DEPLOYMENT_PREFIX: str = "/" if APP_ENV == "development" else "/api"
    LOG_LEVEL: Literal["DEBUG", "INFO"] = "DEBUG" if APP_ENV == "development" else "INFO"
    MOCK_AGENTS: bool = False

    # Generated using 'openssl rand -hex 32'
    # Should only be used in development, production should set the variable
    # We fall back to a random string here to prevent accidents
    JWT_KEY: str = _DEFAULT_JWT_KEY
    JWT_ALGORITHM: str = "HS256"
    JWT_DURATION: datetime.timedelta = datetime.timedelta(minutes=15)
    JWT_REFRESH_DURATION: datetime.timedelta = datetime.timedelta(days=7)

    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"

    CORS_ORIGINS: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def enforce_production_jwt(self) -> Self:
        if self.APP_ENV != "development" and (self.JWT_KEY == _DEFAULT_JWT_KEY or len(self.JWT_KEY) < 64):
            logger.warning("Detected unsafe/unset JWT secret key in a non-development environment, overriding.")
            self.JWT_KEY = os.urandom(32).hex()

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
