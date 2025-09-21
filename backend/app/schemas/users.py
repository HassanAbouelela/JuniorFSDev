import datetime
import uuid
from typing import Self

from pydantic import BaseModel

from app import models


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    name: str
    email: str
    created_at: datetime.datetime
    is_admin: bool
    task_ids: list[uuid.UUID]

    @classmethod
    def from_db(cls, user: models.User) -> Self:
        return cls(
            name=user.name,
            email=user.email,
            created_at=user.created_at,
            is_admin=user.is_admin,
            task_ids=[task.id for task in user.tasks],
        )


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    password: str | None = None
    is_admin: bool | None = None
