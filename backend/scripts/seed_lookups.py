"""Idempotent seed of lookup tables from frontend domain unions."""

from __future__ import annotations

import sys
from pathlib import Path

# Allow `python -m scripts.seed_lookups` from backend/
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app import create_app
from app.extensions import db
from app.models import (
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

ROLES = [("USER", "Citizen", 0), ("ADMIN", "Administrator", 1)]

INCIDENT_TYPES = [
    ("accident", "Accident", 0),
    ("fire", "Fire", 1),
    ("medical", "Medical", 2),
    ("crime", "Crime", 3),
    ("disaster", "Disaster", 4),
]

INCIDENT_STATUSES = [
    ("PENDING", "Pending review", 0),
    ("VERIFIED", "Verified", 1),
    ("IN_PROGRESS", "In progress", 2),
    ("RESOLVED", "Resolved", 3),
    ("CLOSED", "Closed", 4),
]

# Mirrors frontend STATUS_TRANSITIONS / incident_status_transitions
STATUS_TRANSITIONS = [
    ("PENDING", "VERIFIED"),
    ("PENDING", "CLOSED"),
    ("VERIFIED", "IN_PROGRESS"),
    ("VERIFIED", "CLOSED"),
    ("IN_PROGRESS", "RESOLVED"),
    ("RESOLVED", "IN_PROGRESS"),
    ("CLOSED", "PENDING"),
]

URGENCIES = [
    ("CRITICAL", "Critical", 0),
    ("HIGH", "High", 1),
    ("MEDIUM", "Medium", 2),
    ("LOW", "Low", 3),
]

SEVERITIES = [
    ("CRITICAL", "Critical", 0),
    ("MAJOR", "Major", 1),
    ("MODERATE", "Moderate", 2),
    ("MINOR", "Minor", 3),
]

CONTACT_METHODS = [("PHONE", "Phone"), ("EMAIL", "Email"), ("OTHER", "Other")]

VERIFICATION_STATUSES = [
    ("PENDING", "Pending"),
    ("VERIFIED", "Verified"),
    ("FAILED", "Failed"),
]

VERIFICATION_METHODS = [("PHONE", "Phone"), ("EMAIL", "Email"), ("OTHER", "Other")]

CLOSE_REASONS = [
    ("FALSE_REPORT", "False report"),
    ("DUPLICATE", "Duplicate"),
    ("UNABLE_TO_VERIFY", "Unable to verify"),
    ("INSUFFICIENT_INFORMATION", "Insufficient information"),
    ("OTHER", "Other"),
]

DEPARTMENT_TYPES = [
    ("POLICE", "Police", 0),
    ("FIRE", "Fire", 1),
    ("HOSPITAL", "Hospital", 2),
    ("AMBULANCE", "Ambulance", 3),
    ("DISASTER_RESPONSE", "Disaster response", 4),
    ("OTHER", "Other", 5),
]

HANDOFF_STATUSES = [
    ("PENDING", "Pending", 0),
    ("ACKNOWLEDGED", "Acknowledged", 1),
    ("IN_PROGRESS", "In progress", 2),
    ("COMPLETED", "Completed", 3),
    ("CANCELLED", "Cancelled", 4),
]

RESOLUTION_OUTCOMES = [
    ("RESOLVED", "Resolved"),
    ("ASSISTANCE_PROVIDED", "Assistance provided"),
    ("REFERRED", "Referred"),
    ("UNABLE_TO_ASSIST", "Unable to assist"),
    ("OTHER", "Other"),
]

MEDIA_KINDS = [("image", "Image"), ("video", "Video")]

NOTIFICATION_CHANNELS = [
    ("IN_APP", "In-app"),
    ("EMAIL", "Email"),
    ("SMS", "SMS"),
]

NOTIFICATION_EVENT_TYPES = [
    ("REPORT_RECEIVED", "Report received"),
    ("CRITICAL_REPORT_RECEIVED", "Critical report received"),
    ("REPORT_VERIFIED", "Report verified"),
    ("REPORT_CLOSED", "Report closed"),
    ("RESPONSE_STARTED", "Response started"),
    ("DEPARTMENT_ASSIGNED", "Department assigned"),
    ("INCIDENT_RESOLVED", "Incident resolved"),
    ("INCIDENT_ARCHIVED", "Incident archived"),
    ("CITIZEN_STATUS_NOTIFY", "Citizen status notify"),
    ("CRITICAL_INCIDENT", "Critical incident"),
    ("STATUS_IN_PROGRESS", "Status in progress"),
]

AUDIT_ACTIONS = [
    ("REPORT_CREATED", "Report created"),
    ("REPORT_UPDATED", "Report updated"),
    ("REPORT_VERIFIED", "Report verified"),
    ("REPORT_CLOSED", "Report closed"),
    ("RESPONSE_STARTED", "Response started"),
    ("DEPARTMENT_ASSIGNED", "Department assigned"),
    ("DEPARTMENT_HANDOFF_UPDATED", "Department handoff updated"),
    ("DEPARTMENT_CREATED", "Department created"),
    ("DEPARTMENT_UPDATED", "Department updated"),
    ("INCIDENT_RESOLVED", "Incident resolved"),
    ("INCIDENT_REOPENED", "Incident reopened"),
    ("INCIDENT_ARCHIVED", "Incident archived"),
    ("MEDIA_ADDED", "Media added"),
    ("MEDIA_REMOVED", "Media removed"),
    ("NOTE_ADDED", "Note added"),
    ("CITIZEN_NOTIFIED", "Citizen notified"),
    ("URGENCY_UPDATED", "Urgency updated"),
    ("SEVERITY_UPDATED", "Severity updated"),
]


def seed_lookups() -> None:
    for code, label, sort_order in ROLES:
        row = db.session.get(Role, code)
        if row is None:
            db.session.add(Role(code=code, label=label, sort_order=sort_order))
        else:
            row.label = label
            row.sort_order = sort_order

    for code, label, sort_order in INCIDENT_TYPES:
        row = db.session.get(IncidentType, code)
        if row is None:
            db.session.add(IncidentType(code=code, label=label, sort_order=sort_order))
        else:
            row.label = label
            row.sort_order = sort_order

    for code, label, sort_order in INCIDENT_STATUSES:
        row = db.session.get(IncidentStatus, code)
        if row is None:
            db.session.add(IncidentStatus(code=code, label=label, sort_order=sort_order))
        else:
            row.label = label
            row.sort_order = sort_order

    for from_code, to_code in STATUS_TRANSITIONS:
        key = db.session.get(IncidentStatusTransition, (from_code, to_code))
        if key is None:
            db.session.add(
                IncidentStatusTransition(from_code=from_code, to_code=to_code)
            )

    for code, label, rank in URGENCIES:
        row = db.session.get(IncidentUrgency, code)
        if row is None:
            db.session.add(IncidentUrgency(code=code, label=label, rank=rank))
        else:
            row.label = label
            row.rank = rank

    for code, label, rank in SEVERITIES:
        row = db.session.get(IncidentSeverity, code)
        if row is None:
            db.session.add(IncidentSeverity(code=code, label=label, rank=rank))
        else:
            row.label = label
            row.rank = rank

    for code, label in CONTACT_METHODS:
        row = db.session.get(ContactMethod, code)
        if row is None:
            db.session.add(ContactMethod(code=code, label=label))
        else:
            row.label = label

    for code, label in VERIFICATION_STATUSES:
        row = db.session.get(VerificationStatus, code)
        if row is None:
            db.session.add(VerificationStatus(code=code, label=label))
        else:
            row.label = label

    for code, label in VERIFICATION_METHODS:
        row = db.session.get(VerificationMethod, code)
        if row is None:
            db.session.add(VerificationMethod(code=code, label=label))
        else:
            row.label = label

    for code, label in CLOSE_REASONS:
        row = db.session.get(CloseReasonCode, code)
        if row is None:
            db.session.add(CloseReasonCode(code=code, label=label))
        else:
            row.label = label

    for code, label, sort_order in DEPARTMENT_TYPES:
        row = db.session.get(DepartmentType, code)
        if row is None:
            db.session.add(DepartmentType(code=code, label=label, sort_order=sort_order))
        else:
            row.label = label
            row.sort_order = sort_order

    for code, label, sort_order in HANDOFF_STATUSES:
        row = db.session.get(HandoffStatus, code)
        if row is None:
            db.session.add(HandoffStatus(code=code, label=label, sort_order=sort_order))
        else:
            row.label = label
            row.sort_order = sort_order

    for code, label in RESOLUTION_OUTCOMES:
        row = db.session.get(ResolutionOutcome, code)
        if row is None:
            db.session.add(ResolutionOutcome(code=code, label=label))
        else:
            row.label = label

    for code, label in MEDIA_KINDS:
        row = db.session.get(MediaKind, code)
        if row is None:
            db.session.add(MediaKind(code=code, label=label))
        else:
            row.label = label

    for code, label in NOTIFICATION_CHANNELS:
        row = db.session.get(NotificationChannel, code)
        if row is None:
            db.session.add(NotificationChannel(code=code, label=label))
        else:
            row.label = label

    for code, label in NOTIFICATION_EVENT_TYPES:
        row = db.session.get(NotificationEventType, code)
        if row is None:
            db.session.add(NotificationEventType(code=code, label=label))
        else:
            row.label = label

    for code, label in AUDIT_ACTIONS:
        row = db.session.get(AuditAction, code)
        if row is None:
            db.session.add(AuditAction(code=code, label=label))
        else:
            row.label = label

    db.session.commit()


def main() -> None:
    app = create_app()
    with app.app_context():
        seed_lookups()
        print("Lookup seed complete.")


if __name__ == "__main__":
    main()
