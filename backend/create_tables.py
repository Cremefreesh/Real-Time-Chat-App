from app.core.database import Base, engine

from app.models.user import User
from app.models.room import Room
from app.models.message import Message

Base.metadata.create_all(bind=engine)

print("Tables created")