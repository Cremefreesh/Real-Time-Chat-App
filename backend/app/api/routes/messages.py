from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.message import Message

router = APIRouter()


@router.get("/")
def get_messages(room: str = "general", db: Session = Depends(get_db)):
    return (
        db.query(Message)
        .filter(Message.room == room)
        .order_by(Message.created_at.asc())
        .all()
    )


@router.post("/")
def create_message(
    content: str,
    room: str = "general",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = Message(
        content=content,
        room=room,
        user_id=current_user.id,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message