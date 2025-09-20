import datetime
import enum
import typing
import uuid

from sqlalchemy import DateTime, Enum, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base, UTCNow

if typing.TYPE_CHECKING:
    from .task import Task


class AgentType(str, enum.Enum):
    analyzer = "TaskAnalyzer"
    assistant = "ProductivityAssistant"


class AgentResponse(Base):
    __tablename__ = "agent_responses"

    # Response data
    id: Mapped[uuid.UUID] = mapped_column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    agent_type: Mapped[AgentType] = mapped_column(Enum(AgentType), nullable=False)
    response_data: Mapped[str] = mapped_column(Text, nullable=False)

    # Metadata
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=UTCNow(),
        nullable=False,
    )

    # Foreign relations
    task_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tasks.id", ondelete="CASCADE"))

    task: Mapped["Task"] = relationship("Task", back_populates="responses")
