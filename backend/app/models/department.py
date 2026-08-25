"""Departments and incident handoffs."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.extensions import db
from app.models.base import TimestampMixin, UuidPk, new_uuid, utcnow

JsonType = JSON().with_variant(JSONB(), "postgresql")


class Department(TimestampMixin, db.Model):
    __tablename__ = "departments"
    __table_args__ = (
        Index("ix_departments_type_code", "type_code"),
        Index("ix_departments_active", "active"),
        Index("ix_departments_name", "name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UuidPk, primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type_code: Mapped[str] = mapped_column(
        String, ForeignKey("department_types.code"), nullable=False
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    metadata_: Mapped[Optional[dict[str, Any]]] = mapped_column(
        "metadata", JsonType, nullable=True
    )


class IncidentDepartmentHandoff(db.Model):
    __tablename__ = "incident_department_handoffs"
    __table_args__ = (
        UniqueConstraint(
            "incident_id",
            "department_id",
            name="uq_handoff_incident_department",
        ),
        Index("ix_handoffs_incident_id", "incident_id"),
        Index("ix_handoffs_department_id", "department_id"),
        Index("ix_handoffs_status_code", "status_code"),
        Index("ix_handoffs_initiated_by_id", "initiated_by_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UuidPk, primary_key=True, default=new_uuid)
    incident_id: Mapped[uuid.UUID] = mapped_column(
        UuidPk, ForeignKey("incidents.id", ondelete="RESTRICT"), nullable=False
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        UuidPk, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False
    )
    initiated_by_id: Mapped[uuid.UUID] = mapped_column(
        UuidPk, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    initiated_by_name: Mapped[str] = mapped_column(String, nullable=False)
    status_code: Mapped[str] = mapped_column(
        String, ForeignKey("handoff_statuses.code"), nullable=False
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    handed_off_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
