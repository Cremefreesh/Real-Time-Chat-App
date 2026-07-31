from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.models.user import User
from app.models.room import Room
from app.models.message import Message

from app.api.routes import auth
from app.api.routes import rooms
from app.api.routes import messages
#from app.api.routes import profiles

from app.api.routes import auth, rooms, messages, websocket

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Real-Time Chat API",
    version="1.0.0",
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

#
#app.include_router(
#    profiles.router,
#    prefix="/profiles",
#    tags=["Profiles"],
#)


app.include_router(
    websocket.router,
    tags=["WebSocket"],
)


@app.get("/")
def root():
    return {
        "message": "Real-time chat API running",
    }