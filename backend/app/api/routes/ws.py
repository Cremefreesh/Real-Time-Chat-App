from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import verify_token
from app.models.user import User
from app.models.message import Message

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, room_id: int, websocket: WebSocket):
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = []

        self.active_connections[room_id].append(websocket)

    def disconnect(self, room_id: int, websocket: WebSocket):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

    async def broadcast(self, room_id: int, message: dict):
        for connection in self.active_connections.get(room_id, []):
            await connection.send_json(message)


manager = ConnectionManager()


def get_user_from_token(token: str, db: Session):
    payload = verify_token(token)

    if payload is None:
        return None

    email = payload.get("sub")

    if email is None:
        return None

    return db.query(User).filter(User.email == email).first()


@router.websocket("/ws/rooms/{room_id}")
async def websocket_room(websocket: WebSocket, room_id: int):
    token = websocket.query_params.get("token")

    db = SessionLocal()

    try:
        user = get_user_from_token(token, db)

        if user is None:
            await websocket.close(code=1008)
            return

        await manager.connect(room_id, websocket)

        while True:
            data = await websocket.receive_json()
            content = data.get("content")

            if not content:
                continue

            db_message = Message(
                content=content,
                room_id=room_id,
                user_id=user.id
            )

            db.add(db_message)
            db.commit()
            db.refresh(db_message)

            await manager.broadcast(room_id, {
                "id": db_message.id,
                "content": db_message.content,
                "room_id": db_message.room_id,
                "user_id": db_message.user_id,
                "username": user.username,
                "created_at": str(db_message.created_at)
            })

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)

    finally:
        db.close()