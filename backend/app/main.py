from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, rooms, messages, websocket
from app.core.database import Base, engine

from app.models.user import User
from app.models.room import Room
from app.models.message import Message

from app.api.routes import auth, messages, websocket, search
from app.api.routes import profiles

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(rooms.router, prefix="/rooms")
app.include_router(messages.router, prefix="/messages")
app.include_router(websocket.router)
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(profiles.router, prefix="/profiles", tags=["profiles"])

@app.get("/")
def root():
    return {"message": "API running"}