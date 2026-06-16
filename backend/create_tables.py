# create_tables.py
from app.core.database import Base, engine
from app.models import user

Base.metadata.create_all(bind=engine)
print("Tables created!")