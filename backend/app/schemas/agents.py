import uuid
from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict

from app import models
from app.models import AgentType


class AgentResponseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agent_type: AgentType
    # TODO: model response data
    response_data: str
    task_id: uuid.UUID

    created_at: datetime

    @classmethod
    def from_db(cls, response: models.AgentResponse) -> Self:
        return cls.model_validate(response)
