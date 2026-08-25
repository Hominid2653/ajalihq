"""Notifications and audit log (append-oriented)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.extensions import db
from app.models.base import CreatedAtMixin, UuidPk, new_uuid

JsonType = JSON().with_variant(JSONB(), "postgresql")


class Notification(CreatedAtMixin, db.Model):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_recipient_id", "recipient_id"),
        Index("ix_notifications_incident_id", "incident_id"),
        Index("ix_notifications_type_code", "type_code"),
        Index("ix_notifications_channel_code", "channel_code"),
        Index("idx_notifications_inbox", "recipient_id", "read", "created_at"),
        Index("ix_notifications_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UuidPk, primary_key=True, default=new_uuid)
    recipient_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UuidPk, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    incident_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UuidPk, ForeignKey("incidents.id", ondelete="RESTRICT"), nullable=True
    )
    type_code: Mapped[str] = mapped_column(
        String, ForeignKey("notification_event_types.code"), nullable=False
    )
    channel_code: Mapped[str] = mapped_column(
        String, ForeignKey("notification_channels.code"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    metadata_: Mapped[Optional[dict[str, Any]]] = mapped_column(
        "metadata", JsonType, nullable=True
    )


class AuditLog(CreatedAtMixin, db.Model):
    """Append-only. Never UPDATE rows for operational history."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_incident_id", "incident_id"),
        Index("ix_audit_logs_actor_id", "actor_id"),
        Index("ix_audit_logs_action_code", "action_code"),
        Index("ix_audit_logs_entity_type", "entity_type"),
        Index("ix_audit_logs_entity_id", "entity_id"),
        Index("idx_audit_incident_created", "incident_id", "created_at"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UuidPk, primary_key=True, default=new_uuid)
    incident_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UuidPk, ForeignKey("incidents.id", ondelete="RESTRICT"), nullable=True
    )
    incident_reference: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    entity_type: Mapped[str] = mapped_column(String, nullable=False, default="incident")
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(UuidPk, nullable=True)
    actor_id: Mapped[uuid.UUID] = mapped_column(
        UuidPk, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    actor_name: Mapped[str] = mapped_column(String, nullable=False)
    action_code: Mapped[str] = mapped_column(
        String, ForeignKey("audit_actions.code"), nullable=False
    )
    previous_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_: Mapped[Optional[dict[str, Any]]] = mapped_column(
        "metadata", JsonType, nullable=True
    )
