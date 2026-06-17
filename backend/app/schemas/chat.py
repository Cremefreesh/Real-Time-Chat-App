from pydantic import BaseModel
from datetime import datetime


class RoomCreate(BaseModel):
    name: str


class RoomRead(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str


class MessageRead(BaseModel):
    id: int
    content: str
    room_id: int
    user_id: int
    created_at: datetime
    username: str | None = None

    class Config:
        from_attributes = True