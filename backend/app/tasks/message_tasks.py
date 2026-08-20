from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.message import Message
from app.utils.embedding_service import generate_embedding


@celery_app.task(
    name="generate_message_embedding",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={
        "max_retries": 3,
    },
)
def generate_message_embedding(
    message_id: int,
):
    db = SessionLocal()

    try:
        message = (
            db.query(Message)
            .filter(Message.id == message_id)
            .first()
        )

        if message is None:
            return {
                "status": "not_found",
                "message_id": message_id,
            }

        embedding = generate_embedding(
            message.content
        )

        message.embedding = embedding

        db.commit()

        return {
            "status": "completed",
            "message_id": message.id,
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()