from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate


def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:
    return (
        db.query(User)
        .filter(User.email == email.lower())
        .first()
    )


def create_user(
    db: Session,
    user_data: UserCreate,
) -> User:
    existing_user = (
        db.query(User)
        .filter(
            or_(
                User.email == user_data.email.lower(),
                User.username == user_data.username,
            )
        )
        .first()
    )

    if existing_user:
        if existing_user.email == user_data.email.lower():
            raise ValueError("An account with this email already exists")

        raise ValueError("This username is already taken")

    user = User(
        username=user_data.username,
        email=user_data.email.lower(),
        hashed_password=hash_password(user_data.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    user = get_user_by_email(db, email)

    if user is None:
        return None

    if not verify_password(
        password,
        user.hashed_password,
    ):
        return None

    return user