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


async def close_redis():
    await redis_client.aclose()