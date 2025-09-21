import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app import models
from app.auth import read_token_subject
from app.db import SessionFactory

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sockets"])


class ConnectionManager:
    def __init__(self):
        # Map sockets to user IDs and vice-versa for efficient targeted sends
        self._ws_to_user: dict[WebSocket, uuid.UUID] = {}
        self._user_to_ws: dict[uuid.UUID, set[WebSocket]] = {}

    async def register(self, websocket: WebSocket, user_id: uuid.UUID) -> None:
        self._ws_to_user[websocket] = user_id
        self._user_to_ws.setdefault(user_id, set()).add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        user_id = self._ws_to_user.pop(websocket, None)
        if user_id is not None:
            conns = self._user_to_ws.get(user_id)
            if conns and websocket in conns:
                conns.remove(websocket)
                if not conns:
                    self._user_to_ws.pop(user_id, None)

    async def _send_to_users(self, user_ids: set[uuid.UUID], message: dict) -> None:
        for user_id in user_ids:
            for ws in list(self._user_to_ws.get(user_id, set())):
                logger.debug(f"Sending WS {message['event']} to {user_id}")
                try:
                    await ws.send_json(message)
                except Exception as e:
                    # On any failure, drop the socket
                    logger.debug("Error while sending WS message", exc_info=e)
                    self.disconnect(ws)

    async def send_task_update(self, user_ids: set[uuid.UUID], task_payload: dict) -> None:
        """Send a task update event with payload to a set of user IDs."""
        message = {"event": "task.updated", "task": task_payload}
        await self._send_to_users(user_ids, message)

    async def send_task_deletion(self, user_ids: set[uuid.UUID], task_id: uuid.UUID) -> None:
        message = {"event": "task.deleted", "task_id": str(task_id)}
        await self._send_to_users(user_ids, message)


manager = ConnectionManager()


@router.websocket("/tasks")
async def watch_tasks(websocket: WebSocket):
    # Validate JWT from token query parameter (?token=...)
    token = websocket.query_params.get("token", None)
    if token is None:
        await websocket.close(code=1008)
        return

    try:
        subject = read_token_subject(token, "access")
    except Exception:
        # Invalid token; refuse the connection
        await websocket.close(code=1008)
        return

    # Resolve user from subject
    with SessionFactory() as db:
        user = db.execute(select(models.User).where(models.User.email == subject).limit(1)).scalar_one_or_none()

    if user is None:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    await manager.register(websocket, user.id)
    try:
        # Keep the connection alive, but ignore incoming messages
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
