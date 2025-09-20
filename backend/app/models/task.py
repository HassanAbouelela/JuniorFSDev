import datetime
import enum
import typing
import uuid

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base, UTCNow

if typing.TYPE_CHECKING:
    from .agent import AgentResponse
    from .user import User


class TaskPriority(str, enum.Enum):
    high = "High"
    medium = "Medium"
    low = "Low"


class TaskStatus(str, enum.Enum):
    pending = "Pending"
    in_progress = "In Progress"
    completed = "Completed"


class Task(Base):
    __tablename__ = "tasks"

    # Task data
    id: Mapped[uuid.UUID] = mapped_column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority), default=TaskPriority.medium)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.pending)
    deadline: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=UTCNow(),
        nullable=False,
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=UTCNow(),
        onupdate=UTCNow(),
        nullable=False,
    )

    # Foreign relations
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"))

    user: Mapped["User"] = relationship("User", back_populates="tasks")
    responses: Mapped[list["AgentResponse"]] = relationship(
        "AgentResponse",
        back_populates="task",
        cascade="all, delete-orphan",
    )
