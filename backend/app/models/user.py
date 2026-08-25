"""Identity models."""

from __future__ import annotations

import uuid
from typing import Any, Optional

from sqlalchemy import Boolean, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.extensions import db
from app.models.base import TimestampMixin, UuidPk, new_uuid

JsonType = JSON().with_variant(JSONB(), "postgresql")


class User(TimestampMixin, db.Model):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_role_code", "role_code"),
        Index("ix_users_id_verified_created", "id_verified", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UuidPk, primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role_code: Mapped[str] = mapped_column(
        String, ForeignKey("roles.code"), nullable=False
    )
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preferred_contact_method: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("contact_methods.code"), nullable=True
    )
    profile_complete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    id_number: Mapped[Optional[str]] = mapped_column(String, nullable=True, unique=True)
    id_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    metadata_: Mapped[Optional[dict[str, Any]]] = mapped_column(
        "metadata", JsonType, nullable=True
    )
