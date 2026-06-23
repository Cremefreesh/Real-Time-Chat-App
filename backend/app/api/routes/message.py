from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.message import Message

router = APIRouter()

@router.get("/{room_id}")
def get_messages(room_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Message)
        .filter(Message.room_id == room_id)
        .order_by(Message.created_at.asc())
        .all()
    )