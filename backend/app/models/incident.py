"""Incident core and child tables."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.extensions import db
from app.models.base import CreatedAtMixin, TimestampMixin, UuidPk, new_uuid, utcnow

JsonType = JSON().with_variant(JSONB(), "postgresql")


class Incident(TimestampMixin, db.Model):
    __tablename__ = "incidents"
    __table_args__ = (
        Index("ix_incidents_reporter_id", "reporter_id"),
        Index("ix_incidents_status_code", "status_code"),
        Index("ix_incidents_urgency_code", "urgency_code"),
        Index("ix_incidents_severity_code", "severity_code"),
        Index("ix_incidents_type_code", "type_code"),
        Index("ix_incidents_archived", "archived"),
        Index("ix_incidents_created_at", "created_at"),
        Index("idx_incidents_status_created", "status_code", "created_at"),
        Index("idx_incidents_urgency_created", "urgency_code", "created_at"),
        Index("idx_incidents_inbox", "archived", "status_code", "created_at"),
        Index("idx_incidents_coords", "lat", "lng"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UuidPk, primary_key=True, default=new_uuid)
    reference: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    type_code: Mapped[str] = mapped_column(
        String, ForeignKey("incident_types.code"), nullable=False
    )
    urgency_code: Mapped[str] = mapped_column(
        String, ForeignKey("incident_urgencies.code"), nullable=False
    )
    severity_code: Mapped[str] = mapped_column(
        String, ForeignKey("incident_severities.code"), nullable=False
    )
    status_code: Mapped[str] = mapped_column(
        String, ForeignKey("incident_statuses.code"), nullable=False
    )
    location: Mapped[str] = mapped_column(String, nullable=False)
    lat: Mapped[Optional[Decimal]] = mapped_column(Numeric(9, 6), nullable=True)
    lng: Mapped[Optional[Decimal]] = mapped_column(Numeric(9, 6), nullable=True)
    reporter_id: Mapped[uuid.UUID] = mapped_column(
        UuidPk, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    reporter_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    reporter_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    reporter_phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    preferred_contact_method: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("contact_methods.code"), nullable=True
    )
    close_reason_code: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("close_reason_codes.code"), nullable=True
    )
    resolution_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolution_outcome_code: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("resolution_outcomes.code"), nullable=True
    )
    resolved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UuidPk, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    resolved_by_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    archive_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_: Mapped[Optional[dict[str, Any]]] = mapped_column(
        "metadata", JsonType, nullable=True
    )


class ReporterVerification(TimestampMixin, db.Model):
    __tablename__ = "reporter_verifications"
    __table_args__ = (
        Index("ix_reporter_verifications_incident_id", "incident_id"),
        Index("idx_verifications_incident_created", "incident_id", "created_at"),
        Index("ix_reporter_verifications_status_code", "status_code"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UuidPk, primary_key=True, default=new_uuid)
    incident_id: Mapped[uuid.UUID] = mapped_column(
        UuidPk, ForeignKey("incidents.id", ondelete="RESTRICT"), nullable=False
    )
    status_code: Mapped[str] = mapped_column(
        String, ForeignKey("verification_statuses.code"), nullable=False
    )
    method_code: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("verification_methods.code"), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UuidPk, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    verified_by_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class IncidentMedia(CreatedAtMixin, db.Model):
    __tablename__ = "incident_media"
    __table_args__ = (
        Index("ix_incident_media_incident_id", "incident_id"),
        Index("ix_incident_media_kind_code", "kind_code"),
        Index("ix_incident_media_uploaded_by_id", "uploaded_by_id"),
        Index("idx_media_incident_created", "incident_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UuidPk, primary_key=True, default=new_uuid)
    incident_id: Mapped[uuid.UUID] = mapped_column(
        UuidPk, ForeignKey("incidents.id", ondelete="RESTRICT"), nullable=False
    )
    kind_code: Mapped[str] = mapped_column(
        String, ForeignKey("media_kinds.code"), nullable=False
    )
    url: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    storage_key: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    byte_size: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    uploaded_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UuidPk, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class IncidentNote(TimestampMixin, db.Model):
    __tablename__ = "incident_notes"
    __table_args__ = (
        Index("ix_incident_notes_incident_id", "incident_id"),
        Index("ix_incident_notes_author_id", "author_id"),
        Index("idx_notes_incident_created", "incident_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UuidPk, primary_key=True, default=new_uuid)
    incident_id: Mapped[uuid.UUID] = mapped_column(
        UuidPk, ForeignKey("incidents.id", ondelete="RESTRICT"), nullable=False
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UuidPk, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    author_name: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)


class IncidentStatusHistory(CreatedAtMixin, db.Model):
    """Append-only. Never UPDATE or DELETE rows."""

    __tablename__ = "incident_status_history"
    __table_args__ = (
        Index("ix_incident_status_history_incident_id", "incident_id"),
        Index("ix_incident_status_history_actor_id", "actor_id"),
        Index("ix_incident_status_history_to_status_code", "to_status_code"),
        Index("idx_history_incident_created", "incident_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UuidPk, primary_key=True, default=new_uuid)
    incident_id: Mapped[uuid.UUID] = mapped_column(
        UuidPk, ForeignKey("incidents.id", ondelete="RESTRICT"), nullable=False
    )
    from_status_code: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("incident_statuses.code"), nullable=True
    )
    to_status_code: Mapped[str] = mapped_column(
        String, ForeignKey("incident_statuses.code"), nullable=False
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(
        UuidPk, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    actor_name: Mapped[str] = mapped_column(String, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
