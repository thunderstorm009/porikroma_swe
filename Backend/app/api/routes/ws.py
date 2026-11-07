from __future__ import annotations

import json
import logging
import uuid

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.security import _decode_token
from app.db.database import SessionLocal
from app.models import Profile, TripMember, TripMessage
from app.schemas import MessageRead

router = APIRouter(tags=["WebSockets"])
logger = logging.getLogger("porikroma.ws")

MAX_MESSAGE_LENGTH = 5000  # same limit as MessageCreate on the REST endpoint


class ConnectionManager:
    """In-process fan-out. With several workers each process only reaches its own
    sockets; a shared broker (e.g. Redis pub/sub) is needed to scale out."""

    def __init__(self):
        self.active_connections: dict[uuid.UUID, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, trip_id: uuid.UUID):
        await websocket.accept()
        self.active_connections.setdefault(trip_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, trip_id: uuid.UUID):
        connections = self.active_connections.get(trip_id)
        if not connections:
            return
        if websocket in connections:
            connections.remove(websocket)
        if not connections:
            del self.active_connections[trip_id]

    async def broadcast(self, message: dict, trip_id: uuid.UUID):
        for connection in list(self.active_connections.get(trip_id, [])):
            try:
                await connection.send_json(message)
            except Exception:
                # One dead peer must not stop delivery to everyone else.
                logger.info("Dropping unreachable chat socket for trip %s", trip_id)
                self.disconnect(connection, trip_id)


manager = ConnectionManager()


def _is_active_member(trip_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    # Short-lived session: a socket can stay open for hours and must not pin a pooled connection.
    with SessionLocal() as db:
        member = db.scalar(select(TripMember.id).where(TripMember.trip_id == trip_id, TripMember.user_id == user_id))
        status = db.scalar(select(Profile.account_status).where(Profile.id == user_id))
        return member is not None and status == "active"


def _save_message(trip_id: uuid.UUID, user_id: uuid.UUID, content: str) -> dict | None:
    with SessionLocal() as db:
        if db.scalar(select(TripMember.id).where(TripMember.trip_id == trip_id, TripMember.user_id == user_id)) is None:
            return None  # removed from the trip while connected
        msg = TripMessage(trip_id=trip_id, sender_id=user_id, content=content)
        db.add(msg)
        db.commit()
        msg = db.scalar(select(TripMessage).options(selectinload(TripMessage.sender)).where(TripMessage.id == msg.id))
        return MessageRead.model_validate(msg).model_dump(mode="json")


def _extract_text(raw: str) -> str:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return raw.strip()
    if isinstance(payload, dict):
        return str(payload.get("text") or payload.get("content") or "").strip()
    if isinstance(payload, str):
        return payload.strip()
    return ""


@router.websocket("/groups/{group_id}/chat")
@router.websocket("/trips/{group_id}/chat")
async def websocket_chat_endpoint(websocket: WebSocket, group_id: uuid.UUID, token: str = Query(...)):
    try:
        claims = _decode_token(token)
        user_id = uuid.UUID(str(claims["sub"]))
    except Exception:
        logger.info("WebSocket auth rejected for trip %s", group_id)
        await websocket.close(code=1008)
        return

    if not await run_in_threadpool(_is_active_member, group_id, user_id):
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, group_id)
    try:
        while True:
            content = _extract_text(await websocket.receive_text())
            if not content:
                continue
            if len(content) > MAX_MESSAGE_LENGTH:
                await websocket.send_json({"error": f"Messages are limited to {MAX_MESSAGE_LENGTH} characters"})
                continue
            message = await run_in_threadpool(_save_message, group_id, user_id, content)
            if message is None:
                await websocket.close(code=1008)
                break
            await manager.broadcast(message, group_id)
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Trip chat socket failed for trip %s", group_id)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
    finally:
        manager.disconnect(websocket, group_id)
