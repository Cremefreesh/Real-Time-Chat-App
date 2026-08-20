import json
import redis.asyncio as redis


redis_client = redis.from_url(
    "redis://localhost:6379",
    decode_responses=True,
)


async def publish_message(room_id: int, message: dict):
    await redis_client.publish(
        f"room:{room_id}",
        json.dumps(message),
    )


async def claim_message_id(
    user_id: int,
    client_message_id: str,
) -> bool:
    key = f"message-id:{user_id}:{client_message_id}"

    claimed = await redis_client.set(
        key,
        "1",
        nx=True,
        ex=3600,
    )

    return bool(claimed)


async def close_redis():
    await redis_client.aclose()