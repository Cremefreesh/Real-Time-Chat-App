import asyncio
import json

from app.services.redis_service import redis_client


async def redis_listener():
    # Import here to avoid circular imports.
    from app.api.routes.websocket import broadcast_local

    pubsub = redis_client.pubsub()

    await pubsub.psubscribe("room:*")

    try:
        async for message in pubsub.listen():
            if message["type"] != "pmessage":
                continue

            channel = message["channel"]
            payload = message["data"]

            room_id = int(
                channel.split(":")[1]
            )

            outgoing = json.loads(payload)

            await broadcast_local(
                room_id,
                outgoing,
            )

    except asyncio.CancelledError:
        raise

    finally:
        await pubsub.aclose()