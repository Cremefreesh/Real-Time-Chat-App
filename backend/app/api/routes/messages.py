from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.message import Message
from app.utils.semantic_search import semantic_search


router = APIRouter()


@router.get("/{room_id}")
def get_messages(
    room_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(Message)
        .filter(Message.room_id == room_id)
        .order_by(Message.created_at.asc())
        .all()
    )


@router.get("/{room_id}/search")
def semantic_search_messages(
    room_id: int,
    query: str,
    limit: int = 5,
    db: Session = Depends(get_db),
):
    messages = (
        db.query(Message)
        .filter(Message.room_id == room_id)
        .all()
    )

    results = semantic_search(
        query=query,
        messages=messages,
        top_k=limit,
    )

    return [
        {
            "id": result["message"].id,
            "content": result["message"].content,
            "user_id": result["message"].user_id,
            "room_id": result["message"].room_id,
            "similarity": result["similarity"],
        }
        for result in results
    ]