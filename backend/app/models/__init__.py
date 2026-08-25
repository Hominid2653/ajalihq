"""SQLAlchemy models — import here so Flask-Migrate can discover metadata."""

from app.models.audit import AuditLog, Notification
from app.models.department import Department, IncidentDepartmentHandoff
from app.models.incident import (
    Incident,
    IncidentMedia,
    IncidentNote,
    IncidentStatusHistory,
    ReporterVerification,
)
from app.models.lookups import (
    AuditAction,
    CloseReasonCode,
    ContactMethod,
    DepartmentType,
    HandoffStatus,
    IncidentSeverity,
    IncidentStatus,
    IncidentStatusTransition,
    IncidentType,
    IncidentUrgency,
    MediaKind,
    NotificationChannel,
    NotificationEventType,
    ResolutionOutcome,
    Role,
    VerificationMethod,
    VerificationStatus,
)
from app.models.user import User

__all__ = [
    "AuditAction",
    "AuditLog",
    "CloseReasonCode",
    "ContactMethod",
    "Department",
    "DepartmentType",
    "HandoffStatus",
    "Incident",
    "IncidentDepartmentHandoff",
    "IncidentMedia",
    "IncidentNote",
    "IncidentSeverity",
    "IncidentStatus",
    "IncidentStatusHistory",
    "IncidentStatusTransition",
    "IncidentType",
    "IncidentUrgency",
    "MediaKind",
    "Notification",
    "NotificationChannel",
    "NotificationEventType",
    "ReporterVerification",
    "ResolutionOutcome",
    "Role",
    "User",
    "VerificationMethod",
    "VerificationStatus",
]
