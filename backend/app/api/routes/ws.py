from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import verify_token
from app.models.message import Message
from app.models.room import Room
from app.models.user import User

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        # Each room ID maps to a list of connected browser sockets.
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, room_id: int, websocket: WebSocket):
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = []

        self.active_connections[room_id].append(websocket)

    def disconnect(self, room_id: int, websocket: WebSocket):
        connections = self.active_connections.get(room_id)

        if not connections:
            return

        if websocket in connections:
            connections.remove(websocket)

        # Remove empty room entries from memory.
        if not connections:
            del self.active_connections[room_id]

    async def broadcast(self, room_id: int, message: dict):
        disconnected_connections = []

        for connection in self.active_connections.get(room_id, []):
            try:
                await connection.send_json(message)
            except Exception:
                disconnected_connections.append(connection)

        for connection in disconnected_connections:
            self.disconnect(room_id, connection)


manager = ConnectionManager()


def get_user_from_token(token: str | None, db: Session) -> User | None:
    if not token:
        return None

    payload = verify_token(token)

    if payload is None:
        return None

    user_id = payload.get("sub")

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None

    return db.query(User).filter(User.id == user_id).first()


@router.websocket("/ws/rooms/{room_id}")
async def websocket_room(
    websocket: WebSocket,
    room_id: int,
):
    token = websocket.query_params.get("token")
    db = SessionLocal()

    try:
        user = get_user_from_token(token, db)

        if user is None:
            await websocket.close(
                code=1008,
                reason="Invalid or expired token",
            )
            return

        room = db.query(Room).filter(Room.id == room_id).first()

        if room is None:
            await websocket.close(
                code=1008,
                reason="Room not found",
            )
            return

        await manager.connect(room_id, websocket)

        await manager.broadcast(
            room_id,
            {
                "type": "user_joined",
                "user_id": user.id,
                "username": user.username,
                "room_id": room_id,
            },
        )

        while True:
            data = await websocket.receive_json()
            content = str(data.get("content", "")).strip()

            if not content:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Message cannot be empty",
                    }
                )
                continue

            if len(content) > 2000:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Message is too long",
                    }
                )
                continue

            message = Message(
                content=content,
                room_id=room_id,
                user_id=user.id,
            )

            db.add(message)
            db.commit()
            db.refresh(message)

            await manager.broadcast(
                room_id,
                {
                    "type": "chat_message",
                    "id": message.id,
                    "content": message.content,
                    "room_id": message.room_id,
                    "user_id": message.user_id,
                    "username": user.username,
                    "created_at": message.created_at.isoformat(),
                },
            )

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)

        if "user" in locals() and user is not None:
            await manager.broadcast(
                room_id,
                {
                    "type": "user_left",
                    "user_id": user.id,
                    "username": user.username,
                    "room_id": room_id,
                },
            )

    except Exception as exc:
        db.rollback()
        manager.disconnect(room_id, websocket)
        print(f"WebSocket error: {exc}")

    finally:
        db.close()