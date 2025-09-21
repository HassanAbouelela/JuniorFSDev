import uuid

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app import models
from app.auth import REQUIRE_USER
from app.db import DB_SESSION
from app.schemas.tasks import TaskCreate, TaskRead, TaskSummary, TaskUpdate

router = APIRouter(tags=["tasks"])


@router.post("/", response_model=TaskRead, status_code=201)
def create_task(payload: TaskCreate, db: DB_SESSION, user: REQUIRE_USER) -> TaskRead:
    task = models.Task(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status=payload.status,
        deadline=payload.deadline,
        user_id=user.id,
    )
    db.add(task)
    db.flush()
    db.refresh(task)
    return TaskRead.from_db(db, task)


@router.get("/", response_model=list[TaskSummary])
def list_tasks(
    db: DB_SESSION,
    user: REQUIRE_USER,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> list[TaskSummary]:
    query = select(models.Task).where(models.Task.user_id == user.id).offset(skip).limit(limit)
    read = []
    for task in db.execute(query).scalars():
        read.append(TaskSummary.from_db(task))

    return read


def get_task_for_user(db: Session, task_id: uuid.UUID, user_id: uuid.UUID) -> models.Task | None:
    query = select(models.Task).where(models.Task.id == task_id).limit(1)
    task = db.execute(query).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    elif task.user_id != user_id:
        raise HTTPException(status_code=401)
    return task


@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: uuid.UUID, db: DB_SESSION, user: REQUIRE_USER) -> TaskRead:
    task = get_task_for_user(db, task_id, user.id)
    return TaskRead.from_db(db, task)


@router.put("/{task_id}", response_model=TaskRead)
def update_task(task_id: uuid.UUID, payload: TaskUpdate, db: DB_SESSION, user: REQUIRE_USER) -> TaskRead:
    task = get_task_for_user(db, task_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.add(task)
    db.flush()
    db.refresh(task)
    return TaskRead.from_db(db, task)


@router.post("/subscribe/{task_id}/{other_email}", response_model=TaskRead)
def subscribe_user(task_id: uuid.UUID, other_email: str, db: DB_SESSION, user: REQUIRE_USER) -> TaskRead:
    """Allow a user to add another as a viewer to their task."""
    other_user_query = select(models.User).where(models.User.email == other_email).limit(1)
    other_user: models.User | None = db.execute(other_user_query).scalar_one_or_none()
    if other_user is None:
        raise HTTPException(status_code=404, detail="Other user not found.")

    task = get_task_for_user(db, task_id, user.id)

    # Check for existing entry
    existing_query = (
        select(models.TaskReaders)
        .where(
            models.TaskReaders.task_id == task.id,
            models.TaskReaders.user_id == other_user.id,
        )
        .limit(1)
    )

    if db.execute(existing_query).scalar_one_or_none() is None:
        db.add(models.TaskReaders(task_id=task.id, user_id=other_user.id))
        db.flush()

    db.refresh(task)
    return TaskRead.from_db(db, task)


@router.delete("/subscribe/{task_id}/{other_email}", response_model=TaskRead)
def unsubscribe_user(task_id: uuid.UUID, other_email: str, db: DB_SESSION, user: REQUIRE_USER) -> TaskRead:
    other_user_query = select(models.User).where(models.User.email == other_email).limit(1)
    other_user: models.User | None = db.execute(other_user_query).scalar_one_or_none()
    if other_user is None:
        raise HTTPException(status_code=404, detail="Other user not found.")

    # Ensure the task exists and is owned by the current user
    task = get_task_for_user(db, task_id, user.id)

    delete_query = delete(models.TaskReaders).where(
        models.TaskReaders.task_id == task_id,
        models.TaskReaders.user_id == other_user.id,
    )
    db.execute(delete_query)
    db.flush()

    db.refresh(task)
    return TaskRead.from_db(db, task)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: uuid.UUID, db: DB_SESSION, user: REQUIRE_USER) -> None:
    task = get_task_for_user(db, task_id, user.id)
    db.delete(task)
    return None
