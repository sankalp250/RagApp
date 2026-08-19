import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from backend.app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    # Returns naive UTC datetime to match PostgreSQL TIMESTAMP WITHOUT TIME ZONE and avoid asyncpg offset errors
    return datetime.now(timezone.utc).replace(tzinfo=None)


class TimestampMixin:
    created_at = Column(DateTime(timezone=False), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=False), default=get_utc_now, onupdate=get_utc_now, nullable=False)


class UUIDPrimaryKeyMixin:
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
