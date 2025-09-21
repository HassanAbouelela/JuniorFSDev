import uuid

from fastapi import APIRouter

from app import models
from app.auth import REQUIRE_USER
from app.db import DB_SESSION
from app.routers.tasks import get_task_for_user
from app.schemas.agents import AgentResponseRead
from app.services.agents import analyze_task, assist_productivity

router = APIRouter(tags=["agents"])


@router.post("/{task_id}/analyze", response_model=AgentResponseRead)
def analyze(task_id: uuid.UUID, db: DB_SESSION, user: REQUIRE_USER) -> AgentResponseRead:
    # Read task and generate response
    task = get_task_for_user(db, task_id, user.id)
    response_text = analyze_task(task)

    # Save and return response
    response = models.AgentResponse(
        agent_type=models.AgentType.analyzer,
        response_data=response_text,
        task_id=task.id,
    )
    db.add(response)
    db.flush()
    db.refresh(response)
    return AgentResponseRead.from_db(response)


@router.post("/{task_id}/assist", response_model=AgentResponseRead)
def assist(task_id: uuid.UUID, db: DB_SESSION, user: REQUIRE_USER) -> AgentResponseRead:
    task = get_task_for_user(db, task_id, user.id)
    response_text = assist_productivity(task)
    response = models.AgentResponse(
        agent_type=models.AgentType.assistant,
        response_data=response_text,
        task_id=task.id,
    )
    db.add(response)
    db.flush()
    db.refresh(response)
    return AgentResponseRead.from_db(response)
