"""Serialize ORM rows to frontend camelCase DTOs."""

from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from app.models import (
    AuditLog,
    Department,
    Incident,
    IncidentDepartmentHandoff,
    IncidentMedia,
    IncidentNote,
    IncidentStatusHistory,
    Notification,
    ReporterVerification,
)


def _iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.isoformat() + "Z"
    return value.isoformat().replace("+00:00", "Z")


def _str_id(value: UUID | None) -> str | None:
    return str(value) if value is not None else None


def _coord(value: Decimal | float | None) -> float | None:
    if value is None:
        return None
    return float(value)


def incident_to_dict(
    incident: Incident,
    *,
    verification_status: str | None = None,
    public: bool = False,
) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": str(incident.id),
        "reference": incident.reference,
        "title": incident.title,
        "description": incident.description,
        "type": incident.type_code,
        "urgency": incident.urgency_code,
        "severity": incident.severity_code,
        "status": incident.status_code,
        "location": incident.location,
        "lat": _coord(incident.lat),
        "lng": _coord(incident.lng),
        "userId": str(incident.reporter_id),
        "closeReasonCode": incident.close_reason_code,
        "resolutionSummary": incident.resolution_summary,
        "resolutionNotes": incident.resolution_notes,
        "resolutionOutcome": incident.resolution_outcome_code,
        "resolvedById": _str_id(incident.resolved_by_id),
        "resolvedByName": incident.resolved_by_name,
        "resolvedAt": _iso(incident.resolved_at),
        "archived": incident.archived,
        "archiveReason": incident.archive_reason,
        "createdAt": _iso(incident.created_at),
        "updatedAt": _iso(incident.updated_at),
    }
    if public:
        # Public map / community feeds must not expose reporter contact PII.
        data["reporterName"] = None
        data["reporterEmail"] = None
        data["reporterPhone"] = None
        data["preferredContactMethod"] = None
    else:
        data["reporterName"] = incident.reporter_name
        data["reporterEmail"] = incident.reporter_email
        data["reporterPhone"] = incident.reporter_phone
        data["preferredContactMethod"] = incident.preferred_contact_method
    if verification_status is not None:
        data["verificationStatus"] = verification_status
    return data


def verification_to_dict(row: ReporterVerification) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "incidentId": str(row.incident_id),
        "status": row.status_code,
        "method": row.method_code,
        "notes": row.notes,
        "verifiedById": _str_id(row.verified_by_id),
        "verifiedByName": row.verified_by_name,
        "verifiedAt": _iso(row.verified_at),
        "createdAt": _iso(row.created_at),
        "updatedAt": _iso(row.updated_at),
    }


def note_to_dict(row: IncidentNote) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "incidentId": str(row.incident_id),
        "authorId": str(row.author_id),
        "authorName": row.author_name,
        "body": row.body,
        "createdAt": _iso(row.created_at),
    }


def media_to_dict(row: IncidentMedia) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "incidentId": str(row.incident_id),
        "kind": row.kind_code,
        "url": row.url,
        "name": row.name,
        "createdAt": _iso(row.created_at),
    }


def history_to_dict(row: IncidentStatusHistory) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "incidentId": str(row.incident_id),
        "fromStatus": row.from_status_code,
        "toStatus": row.to_status_code,
        "actorId": str(row.actor_id),
        "actorName": row.actor_name,
        "reason": row.reason,
        "createdAt": _iso(row.created_at),
    }


def department_to_dict(row: Department) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "name": row.name,
        "type": row.type_code,
        "description": row.description,
        "phone": row.phone,
        "email": row.email,
        "location": row.location,
        "active": row.active,
        "createdAt": _iso(row.created_at),
        "updatedAt": _iso(row.updated_at),
    }


def handoff_to_dict(row: IncidentDepartmentHandoff) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "incidentId": str(row.incident_id),
        "departmentId": str(row.department_id),
        "initiatedById": str(row.initiated_by_id),
        "initiatedByName": row.initiated_by_name,
        "status": row.status_code,
        "notes": row.notes,
        "handedOffAt": _iso(row.handed_off_at),
        "acknowledgedAt": _iso(row.acknowledged_at),
        "completedAt": _iso(row.completed_at),
        "updatedAt": _iso(row.updated_at),
    }


def notification_to_dict(row: Notification) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": str(row.id),
        "incidentId": _str_id(row.incident_id),
        "type": row.type_code,
        "channel": row.channel_code,
        "title": row.title,
        "body": row.body,
        "read": row.read,
        "createdAt": _iso(row.created_at),
    }
    if row.metadata_:
        data["metadata"] = row.metadata_
        status = row.metadata_.get("deliveryStatus")
        if status:
            data["deliveryStatus"] = status
    return data


def audit_to_dict(row: AuditLog) -> dict[str, Any]:
    metadata = row.metadata_
    if isinstance(metadata, dict):
        metadata_out: str | None = json.dumps(metadata) if metadata else None
    else:
        metadata_out = metadata  # type: ignore[assignment]

    return {
        "id": str(row.id),
        "incidentId": _str_id(row.incident_id),
        "incidentReference": row.incident_reference,
        "actorId": str(row.actor_id),
        "actorName": row.actor_name,
        "action": row.action_code,
        "previousValue": row.previous_value,
        "newValue": row.new_value,
        "reason": row.reason,
        "metadata": metadata_out,
        "createdAt": _iso(row.created_at),
    }
