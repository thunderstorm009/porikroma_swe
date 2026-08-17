from typing import Dict, List
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import _decode_token
from app.models import TripMember, TripMessage
from app.schemas import MessageRead

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group_id: uuid.UUID):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, websocket: WebSocket, group_id: uuid.UUID):
        if group_id in self.active_connections:
            self.active_connections[group_id].remove(websocket)
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]

    async def broadcast(self, message: dict, group_id: uuid.UUID):
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/groups/{group_id}/chat")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    group_id: uuid.UUID,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    try:
        claims = _decode_token(token)
        user_id = uuid.UUID(str(claims["sub"]))
    except Exception:
        await websocket.close(code=1008)
        return

    member = db.scalar(select(TripMember).where(TripMember.trip_id == group_id, TripMember.user_id == user_id))
    if not member:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()
            
            msg = TripMessage(
                trip_id=group_id,
                sender_id=user_id,
                content=data
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)
            
            # Need to reload to get the sender profile for MessageRead
            db.refresh(msg, ["sender"])
            
            read_model = MessageRead.model_validate(msg).model_dump(mode='json')
            await manager.broadcast(read_model, group_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)
