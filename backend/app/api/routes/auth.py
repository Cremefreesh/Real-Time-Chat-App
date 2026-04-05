# backend/app/api/routes/auth.py
from fastapi import APIRouter

router = APIRouter()  # ✅ make sure this line exists

@router.get("/ping")
def ping():
    return {"message": "pong"}


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import create_user, get_password_hash
from app.core.database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/signup", response_model=UserRead)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = create_user(db, user)
    return db_user