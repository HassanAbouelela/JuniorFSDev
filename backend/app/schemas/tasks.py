import datetime
import uuid
from typing import Self

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app import models
from app.models import TaskPriority, TaskStatus


class TaskBase(BaseModel):
    title: str = Field(max_length=100)
    description: str = Field(max_length=5000)
    priority: TaskPriority = TaskPriority.medium
    status: TaskStatus = TaskStatus.pending
    deadline: datetime.datetime | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(None, max_length=100)
    description: str | None = Field(None, max_length=5000)
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    deadline: datetime.datetime | None = None


class TaskSummary(BaseModel):
    """Model with reduced data to make large queries more efficient."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    priority: TaskPriority
    status: TaskStatus
    deadline: datetime.datetime | None
    user_id: uuid.UUID
    owner_name: str = ""
    owner_email: str = ""

    @classmethod
    def from_db(cls, task: models.Task) -> Self:
        result = cls.model_validate(task)
        result.owner_name = task.user.name
        result.owner_email = task.user.email
        return result


class TaskRead(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime
    user_id: uuid.UUID
    owner_name: str = ""
    owner_email: str = ""
    reader_emails: list[str] = Field(default_factory=list)

    @classmethod
    def from_db(cls, db: Session, task: models.Task) -> Self:
        result = cls.model_validate(task)
        result.owner_name = task.user.name
        result.owner_email = task.user.email
        result.reader_emails = task.get_reader_emails(db)
        return result
