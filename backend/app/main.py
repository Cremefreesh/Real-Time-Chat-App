from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.core.database import Base, engine

# Import models before create_all so SQLAlchemy knows
# which tables need to be created.
from app.models.user import User  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Real-Time Chat API",
    version="1.0.0",
)

app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Real-Time Chat API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }