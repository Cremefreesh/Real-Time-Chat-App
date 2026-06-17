from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.room import Room
from app.models.message import Message
from app.schemas.chat import RoomCreate, RoomRead, MessageRead

router = APIRouter()


@router.post("/rooms", response_model=RoomRead)
def create_room(
    room: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_room = db.query(Room).filter(Room.name == room.name).first()

    if existing_room:
        raise HTTPException(status_code=400, detail="Room already exists")

    db_room = Room(name=room.name)
    db.add(db_room)
    db.commit()
    db.refresh(db_room)

    return db_room


@router.get("/rooms", response_model=list[RoomRead])
def get_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Room).order_by(Room.created_at.desc()).all()


@router.get("/rooms/{room_id}/messages")
def get_room_messages(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = (
        db.query(Message, User.username)
        .join(User, Message.user_id == User.id)
        .filter(Message.room_id == room_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return [
        {
            "id": message.id,
            "content": message.content,
            "room_id": message.room_id,
            "user_id": message.user_id,
            "created_at": message.created_at,
            "username": username,
        }
        for message, username in messages
    ]