"""Lookup tables — domain codes are rows, not PostgreSQL ENUMs."""

from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db


class Role(db.Model):
    __tablename__ = "roles"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class IncidentType(db.Model):
    __tablename__ = "incident_types"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class IncidentStatus(db.Model):
    __tablename__ = "incident_statuses"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class IncidentStatusTransition(db.Model):
    __tablename__ = "incident_status_transitions"

    from_code: Mapped[str] = mapped_column(
        String, ForeignKey("incident_statuses.code"), primary_key=True
    )
    to_code: Mapped[str] = mapped_column(
        String, ForeignKey("incident_statuses.code"), primary_key=True
    )


class IncidentUrgency(db.Model):
    __tablename__ = "incident_urgencies"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class IncidentSeverity(db.Model):
    __tablename__ = "incident_severities"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class ContactMethod(db.Model):
    __tablename__ = "contact_methods"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)


class VerificationStatus(db.Model):
    __tablename__ = "verification_statuses"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)


class VerificationMethod(db.Model):
    __tablename__ = "verification_methods"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)


class CloseReasonCode(db.Model):
    __tablename__ = "close_reason_codes"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class DepartmentType(db.Model):
    __tablename__ = "department_types"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class HandoffStatus(db.Model):
    __tablename__ = "handoff_statuses"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class ResolutionOutcome(db.Model):
    __tablename__ = "resolution_outcomes"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class MediaKind(db.Model):
    __tablename__ = "media_kinds"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)


class NotificationChannel(db.Model):
    __tablename__ = "notification_channels"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)


class NotificationEventType(db.Model):
    __tablename__ = "notification_event_types"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class AuditAction(db.Model):
    __tablename__ = "audit_actions"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
