import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import verify_token
from app.models.user import User
from app.models.message import Message

from app.utils.embedding_service import generate_embedding
from app.services.moderation_service import moderate_message
from app.services.redis_service import (
    publish_message,
    claim_message_id,
)


router = APIRouter()

# Stores WebSocket connections belonging to THIS FastAPI process.
#
# Example:
#
# rooms = {
#     1: [websocket_a, websocket_b],
#     2: [websocket_c],
# }
#
# Redis handles communication between separate FastAPI processes.
rooms = {}


async def broadcast_local(room_id: int, outgoing: dict):
    """
    Broadcast a message to WebSocket connections attached
    to THIS FastAPI process.

    Redis distributes the message between backend instances.
    Each instance then calls this function for its own clients.
    """

    connections = rooms.get(room_id, [])

    dead_connections = []

    for connection in connections:
        try:
            await connection.send_text(
                json.dumps(outgoing)
            )

        except Exception:
            dead_connections.append(connection)

    # Clean up connections which are no longer alive.
    for connection in dead_connections:
        if connection in connections:
            connections.remove(connection)

    # Remove the room entirely if nobody on this process
    # is connected anymore.
    if not connections and room_id in rooms:
        del rooms[room_id]


@router.websocket("/ws/rooms/{room_id}")
async def websocket_room(
    websocket: WebSocket,
    room_id: int,
    token: str = Query(...),
):
    # -------------------------------------------------------
    # 1. Authenticate WebSocket connection
    # -------------------------------------------------------

    payload = verify_token(token)

    if payload is None:
        await websocket.close(code=1008)
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
        await websocket.close(code=1008)
        db.close()
        return

    # -------------------------------------------------------
    # 2. Accept connection
    # -------------------------------------------------------

    await websocket.accept()

    if room_id not in rooms:
        rooms[room_id] = []

    rooms[room_id].append(websocket)

    print(
        f"User {user.username} connected to room {room_id}"
    )

    try:

        # ---------------------------------------------------
        # 3. Receive messages
        # ---------------------------------------------------

        while True:

            raw_data = await websocket.receive_text()

            try:
                data = json.loads(raw_data)

            except json.JSONDecodeError:
                await websocket.send_text(
                    json.dumps({
                        "type": "message_error",
                        "message": "Invalid JSON.",
                    })
                )

                continue

            content = data.get("content")
            client_message_id = data.get(
                "client_message_id"
            )

            # ------------------------------------------------
            # 4. Validate message
            # ------------------------------------------------

            if not content:
                await websocket.send_text(
                    json.dumps({
                        "type": "message_error",
                        "message": "Message content is required.",
                    })
                )

                continue

            if not client_message_id:
                await websocket.send_text(
                    json.dumps({
                        "type": "message_error",
                        "message": (
                            "client_message_id is required."
                        ),
                    })
                )

                continue

            # ------------------------------------------------
            # 5. Moderation
            # ------------------------------------------------

            moderation = moderate_message(content)

            if not moderation["allowed"]:

                await websocket.send_text(
                    json.dumps({
                        "type": "moderation_warning",
                        "client_message_id": (
                            client_message_id
                        ),
                        "message": (
                            "Your message was blocked "
                            "by moderation."
                        ),
                        "reason": moderation["reason"],
                        "flagged_words": (
                            moderation["flagged_words"]
                        ),
                    })
                )

                continue

            # ------------------------------------------------
            # 6. Idempotency check
            # ------------------------------------------------
            #
            # claim_message_id uses Redis SET NX.
            #
            # First time:
            #     True
            #
            # Retry using same client_message_id:
            #     False
            #
            # This prevents duplicate DB messages.

            claimed = await claim_message_id(
                user.id,
                client_message_id,
            )

            if not claimed:

                await websocket.send_text(
                    json.dumps({
                        "type": "message_ack",
                        "client_message_id": (
                            client_message_id
                        ),
                        "status": "duplicate",
                    })
                )

                continue

            # ------------------------------------------------
            # 7. Create + persist message
            # ------------------------------------------------

            try:

                message = Message(
                    content=content,
                    user_id=user.id,
                    room_id=room_id,
                    embedding=generate_embedding(content),
                )

                db.add(message)
                db.commit()
                db.refresh(message)

            except Exception as exc:

                db.rollback()

                print(
                    "Failed to save message:",
                    exc,
                )

                await websocket.send_text(
                    json.dumps({
                        "type": "message_error",
                        "client_message_id": (
                            client_message_id
                        ),
                        "message": (
                            "Failed to save message."
                        ),
                    })
                )

                continue

            # ------------------------------------------------
            # 8. Create outgoing chat payload
            # ------------------------------------------------

            outgoing = {
                "type": "chat_message",
                "id": message.id,
                "client_message_id": (
                    client_message_id
                ),
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

            # ------------------------------------------------
            # 9. Publish through Redis
            # ------------------------------------------------
            #
            # Every FastAPI instance subscribed to Redis
            # receives this event.
            #
            # redis_listener.py then calls broadcast_local()
            # on each process.

            await publish_message(
                room_id,
                outgoing,
            )

            # ------------------------------------------------
            # 10. ACK the original sender
            # ------------------------------------------------
            #
            # Tells the frontend:
            #
            # "Your client-generated message ID has been
            # successfully processed and persisted."

            await websocket.send_text(
                json.dumps({
                    "type": "message_ack",
                    "client_message_id": (
                        client_message_id
                    ),
                    "message_id": message.id,
                    "status": "accepted",
                })
            )

    except WebSocketDisconnect:

        print(
            f"User {user.username} disconnected "
            f"from room {room_id}"
        )

    except Exception as exc:

        print(
            "Unexpected WebSocket error:",
            exc,
        )

    finally:

        # ---------------------------------------------------
        # 11. Connection cleanup
        # ---------------------------------------------------

        if room_id in rooms:

            if websocket in rooms[room_id]:
                rooms[room_id].remove(websocket)

            if not rooms[room_id]:
                del rooms[room_id]

        db.close()