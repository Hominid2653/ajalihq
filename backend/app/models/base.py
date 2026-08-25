"""Shared model helpers."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.extensions import db


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# Portable UUID: Postgres native UUID; SQLite uses char storage via Uuid.
UuidPk = Uuid().with_variant(UUID(as_uuid=True), "postgresql")


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=utcnow,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=utcnow,
        onupdate=utcnow,
    )


class CreatedAtMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=utcnow,
    )


def new_uuid() -> uuid.UUID:
    return uuid.uuid4()
