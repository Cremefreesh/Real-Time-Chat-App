from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import ProfileUpdate, ProfileRead

router = APIRouter()


@router.get("/me", response_model=ProfileRead)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=ProfileRead)
def update_my_profile(
    profile: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if profile.username is not None:
        existing_user = (
            db.query(User)
            .filter(User.username == profile.username, User.id != current_user.id)
            .first()
        )

        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")

        current_user.username = profile.username

    if profile.bio is not None:
        current_user.bio = profile.bio

    if profile.avatar_url is not None:
        current_user.avatar_url = profile.avatar_url

    db.commit()
    db.refresh(current_user)

    return current_user


@router.get("/{user_id}", response_model=ProfileRead)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user