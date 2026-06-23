from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.room import Room

router = APIRouter()

@router.get("/")
def get_rooms(db: Session = Depends(get_db)):
    return db.query(Room).all()

@router.post("/")
def create_room(name: str, db: Session = Depends(get_db)):
    room = Room(name=name)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room