import asyncio

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.models.user import User
from app.models.room import Room
from app.models.message import Message

from app.api.routes import auth, rooms, messages, websocket

from app.services.redis_listener import redis_listener
from app.services.redis_service import close_redis


Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    listener_task = asyncio.create_task(
        redis_listener()
    )

    yield

    listener_task.cancel()

    try:
        await listener_task
    except asyncio.CancelledError:
        pass

    await close_redis()


app = FastAPI(
    title="Real-Time Chat API",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"],
)

app.include_router(
    rooms.router,
    prefix="/rooms",
    tags=["Rooms"],
)

app.include_router(
    messages.router,
    prefix="/messages",
    tags=["Messages"],
)

app.include_router(
    websocket.router,
    tags=["WebSocket"],
)


@app.get("/")
def root():
    return {
        "message": "Real-time chat API running",
    }