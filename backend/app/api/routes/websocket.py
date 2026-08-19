import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import verify_token
from app.models.user import User
from app.models.message import Message
from app.utils.embedding_service import generate_embedding
from app.services.moderation_service import moderate_message
from app.services.redis_service import publish_message


router = APIRouter()

# Connections held by THIS FastAPI process only.
rooms = {}


async def broadcast_local(room_id: int, outgoing: dict):
    connections = rooms.get(room_id, [])

    dead_connections = []

    for connection in connections:
        try:
            await connection.send_text(
                json.dumps(outgoing)
            )
        except Exception:
            dead_connections.append(connection)

    for connection in dead_connections:
        if connection in connections:
            connections.remove(connection)

    if not connections and room_id in rooms:
        del rooms[room_id]


@router.websocket("/ws/rooms/{room_id}")
async def websocket_room(
    websocket: WebSocket,
    room_id: int,
    token: str = Query(...),
):
    payload = verify_token(token)

    if payload is None:
        await websocket.close()
        return

    db: Session = SessionLocal()

    subject = payload.get("sub")

    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        print(
            "WebSocket rejected: invalid user ID in token:",
            subject,
        )
        await websocket.close(code=1008)
        db.close()
        return

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

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

            moderation = moderate_message(
                data["content"]
            )

            if not moderation["allowed"]:
                await websocket.send_text(
                    json.dumps({
                        "type": "moderation_warning",
                        "message": (
                            "Your message was blocked by moderation."
                        ),
                        "reason": moderation["reason"],
                        "flagged_words": moderation["flagged_words"],
                    })
                )
                continue

            message = Message(
                content=data["content"],
                user_id=user.id,
                room_id=room_id,
                embedding=generate_embedding(
                    data["content"]
                ),
            )

            db.add(message)
            db.commit()
            db.refresh(message)

            outgoing = {
                "type": "chat_message",
                "id": message.id,
                "content": message.content,
                "user_id": user.id,
                "username": user.username,
                "room_id": room_id,
                "created_at": (
                    message.created_at.isoformat()
                    if message.created_at
                    else None
                ),
            }

            # OLD:
            #
            # for connection in rooms[room_id]:
            #     await connection.send_text(
            #         json.dumps(outgoing)
            #     )

            # NEW:
            await publish_message(
                room_id,
                outgoing,
            )

    except WebSocketDisconnect:
        if (
            room_id in rooms
            and websocket in rooms[room_id]
        ):
            rooms[room_id].remove(websocket)

            if not rooms[room_id]:
                del rooms[room_id]

    finally:
        db.close()
        