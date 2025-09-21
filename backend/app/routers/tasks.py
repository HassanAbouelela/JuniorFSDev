import uuid

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app import models
from app.auth import REQUIRE_USER
from app.db import DB_SESSION
from app.routers.sockets import manager
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
    query = (
        select(models.Task)
        .where(
            or_(
                models.Task.user_id == user.id,
                models.Task.readers.any(models.TaskReaders.user_id == user.id),
            )
        )
        .offset(skip)
        .limit(limit)
    )
    read = []
    for task in db.execute(query).scalars():
        read.append(TaskSummary.from_db(task))

    return read


def get_task_for_user(
    db: Session,
    task_id: uuid.UUID,
    user_id: uuid.UUID,
    allow_readers: bool = False,
) -> models.Task | None:
    query = select(models.Task).where(models.Task.id == task_id).limit(1)
    task: models.Task | None = db.execute(query).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    elif task.user_id != user_id and not (allow_readers and any(user_id == r.user_id for r in task.readers)):
        raise HTTPException(status_code=401)
    return task


@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: uuid.UUID, db: DB_SESSION, user: REQUIRE_USER) -> TaskRead:
    task = get_task_for_user(db, task_id, user.id, allow_readers=True)
    return TaskRead.from_db(db, task)


async def send_task_update(
    db: Session,
    task: models.Task,
    updated: TaskRead | None,
) -> None:
    """
    Send updated task information to subscribed users.

    If updated is None, we send a deletion notification instead.
    """
    # Determine recipients
    # If in the future we want to update the owner as well, we can just add them to this set
    reader_ids = set(
        db.execute(select(models.TaskReaders.user_id).where(models.TaskReaders.task_id == task.id)).scalars()
    )

    if updated is None:
        await manager.send_task_deletion(reader_ids, task.id)
    else:
        await manager.send_task_update(reader_ids, updated.model_dump_json())


@router.put("/{task_id}", response_model=TaskRead)
async def update_task(task_id: uuid.UUID, payload: TaskUpdate, db: DB_SESSION, user: REQUIRE_USER) -> TaskRead:
    task = get_task_for_user(db, task_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.add(task)
    db.flush()
    db.refresh(task)

    # Prepare payload and notify connected websocket clients
    updated = TaskRead.from_db(db, task)
    await send_task_update(db, task, updated)

    return updated


@router.post("/subscribe/{task_id}/{other_email}", response_model=TaskRead)
async def subscribe_user(task_id: uuid.UUID, other_email: str, db: DB_SESSION, user: REQUIRE_USER) -> TaskRead:
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
    updated = TaskRead.from_db(db, task)
    await send_task_update(db, task, updated)
    return updated


@router.delete("/subscribe/{task_id}/{other_email}", response_model=TaskRead)
async def unsubscribe_user(task_id: uuid.UUID, other_email: str, db: DB_SESSION, user: REQUIRE_USER) -> TaskRead:
    other_user_query = select(models.User).where(models.User.email == other_email).limit(1)
    other_user: models.User | None = db.execute(other_user_query).scalar_one_or_none()
    if other_user is None:
        raise HTTPException(status_code=404, detail="Other user not found.")

    # Ensure the task exists and is owned by the current user, or can be operated on as selected
    task = get_task_for_user(db, task_id, user.id, allow_readers=True)
    if task.user_id != user.id and user.email != other_email:
        raise HTTPException(status_code=400, detail="No permission to remove this user.")

    if not any(other_user.id == reader.user_id for reader in task.readers):
        # Avoid performing additional operations if the subscription doesn't exist
        return TaskRead.from_db(db, task)

    delete_query = delete(models.TaskReaders).where(
        models.TaskReaders.task_id == task_id,
        models.TaskReaders.user_id == other_user.id,
    )
    db.execute(delete_query)
    db.flush()

    db.refresh(task)
    updated = TaskRead.from_db(db, task)
    await send_task_update(db, task, updated)

    # We also need to tell the removed user that the task is gone from their dashboard
    await manager.send_task_deletion({other_user.id}, task_id)

    return updated


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: uuid.UUID, db: DB_SESSION, user: REQUIRE_USER) -> None:
    task = get_task_for_user(db, task_id, user.id)
    # Notify about deletion before we perform the deletion, so we can get the subscribed user list
    await send_task_update(db, task, None)
    db.delete(task)
    return None
