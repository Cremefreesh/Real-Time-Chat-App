from celery import Celery


celery_app = Celery(
    "chat_tasks",

    broker="redis://localhost:6379/0",

    backend="redis://localhost:6379/1",

    include=[
        "app.tasks.message_tasks",
    ],
)


celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
)