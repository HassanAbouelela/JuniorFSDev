import datetime
import typing
import uuid

from sqlalchemy import Boolean, DateTime, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base, UTCNow

if typing.TYPE_CHECKING:
    from .task import Task


class User(Base):
    __tablename__ = "users"

    # User data
    id: Mapped[uuid.UUID] = mapped_column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Metadata
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=UTCNow(),  # Generated server side for consistency
        nullable=False,
    )

    # Foreign relations
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="user")
