# app/api/routes/search.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.message import Message
from app.utils.embedding_service import generate_embedding
from app.utils.cosine_similarity import cosine_similarity

router = APIRouter()

@router.get("/semantic")
def semantic_search(query: str, room_id: int, db: Session = Depends(get_db)):
    query_embedding = generate_embedding(query)

    messages = (
        db.query(Message)
        .filter(Message.room_id == room_id)
        .filter(Message.embedding.isnot(None))
        .all()
    )

    results = []

    for message in messages:
        score = cosine_similarity(query_embedding, message.embedding)

        results.append({
            "id": message.id,
            "content": message.content,
            "room_id": message.room_id,
            "user_id": message.user_id,
            "similarity": round(score, 3),
        })

    results.sort(key=lambda item: item["similarity"], reverse=True)

    return results[:5]