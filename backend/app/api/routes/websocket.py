import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import verify_token
from app.models.user import User
from app.models.message import Message
from app.utils.embedding_service import generate_embedding
#care changed app.utils from app.services.embedding_service


router = APIRouter()

rooms = {}

@router.websocket("/ws/rooms/{room_id}")
async def websocket_room(websocket: WebSocket, room_id: int, token: str = Query(...)):
    payload = verify_token(token)

    if payload is None:
        await websocket.close()
        return

    db: Session = SessionLocal()
    user = db.query(User).filter(User.email == payload.get("sub")).first()

    if user is None:
        await websocket.close()
        db.close()
        return

    await websocket.accept()

    if room_id not in rooms:
        rooms[room_id] = []

    rooms[room_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            data = json.loads(data)

            message = Message(
                content=data["content"],
                user_id=user.id,
                room_id=room_id,
                embedding=generate_embedding(data["content"]),
            )

            db.add(message)
            db.commit()
            db.refresh(message)

            outgoing = {
                "id": message.id,
                "content": message.content,
                "user_id": user.id,
                "username": user.username,
                "room_id": room_id,
            }

            for connection in rooms[room_id]:
                await connection.send_text(json.dumps(outgoing))

    except WebSocketDisconnect:
        rooms[room_id].remove(websocket)
    finally:
        db.close()