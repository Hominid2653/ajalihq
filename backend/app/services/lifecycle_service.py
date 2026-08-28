"""Incident lifecycle transitions (admin moderation)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from flask_smorest import abort
from sqlalchemy import select

from app.extensions import db
from app.models import (
    AuditLog,
    Department,
    Incident,
    IncidentDepartmentHandoff,
    IncidentStatusHistory,
    IncidentStatusTransition,
    Notification,
    ReporterVerification,
    User,
)
from app.services.incident_service import get_incident_or_404
from app.utils.serialize import incident_to_dict


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def assert_can_transition(from_status: str, to_status: str) -> None:
    allowed = db.session.get(IncidentStatusTransition, (from_status, to_status))
    if allowed is None:
        abort(
            409,
            message=f"Cannot transition {from_status} to {to_status}.",
        )


def _require_admin(actor: User) -> None:
    if actor.role_code != "ADMIN":
        abort(403, message="Only admins can change incident lifecycle status.")


def _require_mutable(incident: Incident) -> None:
    if incident.archived:
        abort(409, message="Archived incidents cannot change status.")


def _add_history(
    incident: Incident,
    *,
    from_status: str | None,
    to_status: str,
    actor: User,
    reason: str | None,
    now: datetime,
) -> None:
    db.session.add(
        IncidentStatusHistory(
            incident_id=incident.id,
            from_status_code=from_status,
            to_status_code=to_status,
            actor_id=actor.id,
            actor_name=actor.name,
            reason=reason,
            created_at=now,
        )
    )


def _add_audit(
    incident: Incident,
    *,
    actor: User,
    action: str,
    previous: str | None,
    new: str | None,
    reason: str | None,
    now: datetime,
    metadata: dict[str, Any] | None = None,
) -> None:
    db.session.add(
        AuditLog(
            incident_id=incident.id,
            incident_reference=incident.reference,
            entity_type="incident",
            entity_id=incident.id,
            actor_id=actor.id,
            actor_name=actor.name,
            action_code=action,
            previous_value=previous,
            new_value=new,
            reason=reason,
            metadata_=metadata,
            created_at=now,
        )
    )


def _add_notification(
    incident: Incident,
    *,
    type_code: str,
    title: str,
    body: str,
    now: datetime,
    channel: str = "IN_APP",
    recipient_id: UUID | None = None,
) -> None:
    db.session.add(
        Notification(
            recipient_id=recipient_id,
            incident_id=incident.id,
            type_code=type_code,
            channel_code=channel,
            title=title,
            body=body,
            read=False,
            created_at=now,
        )
    )


def verify_incident(incident_id: str, data: dict[str, Any], actor: User) -> dict[str, Any]:
    _require_admin(actor)
    incident = get_incident_or_404(incident_id)
    _require_mutable(incident)
    assert_can_transition(incident.status_code, "VERIFIED")

    now = _utcnow()
    from_status = incident.status_code
    notes = (data.get("notes") or "").strip() or None
    method = data["method"]

    verification = ReporterVerification(
        incident_id=incident.id,
        status_code="VERIFIED",
        method_code=method,
        notes=notes,
        verified_by_id=actor.id,
        verified_by_name=actor.name,
        verified_at=now,
        created_at=now,
        updated_at=now,
    )
    db.session.add(verification)
    db.session.flush()

    incident.status_code = "VERIFIED"
    incident.updated_at = now

    reason = notes or f"Verified via {method}"
    _add_history(
        incident,
        from_status=from_status,
        to_status="VERIFIED",
        actor=actor,
        reason=reason,
        now=now,
    )
    _add_audit(
        incident,
        actor=actor,
        action="REPORT_VERIFIED",
        previous=from_status,
        new="VERIFIED",
        reason=notes,
        now=now,
        metadata={"method": method, "verificationId": str(verification.id)},
    )
    _add_notification(
        incident,
        type_code="REPORT_VERIFIED",
        title="Report verified",
        body=f"{incident.reference} verified via {method}.",
        now=now,
    )
    db.session.commit()
    result = incident_to_dict(incident)
    result["verificationId"] = str(verification.id)
    return result


def close_incident(incident_id: str, data: dict[str, Any], actor: User) -> dict[str, Any]:
    _require_admin(actor)
    reason = data["reason"].strip()
    if not reason:
        abort(400, message="A close reason is required.")

    incident = get_incident_or_404(incident_id)
    _require_mutable(incident)
    assert_can_transition(incident.status_code, "CLOSED")

    now = _utcnow()
    from_status = incident.status_code
    fail_verification = bool(data.get("failVerification")) or from_status == "PENDING"

    if fail_verification:
        verification = ReporterVerification(
            incident_id=incident.id,
            status_code="FAILED",
            method_code="OTHER",
            notes=reason,
            verified_by_id=actor.id,
            verified_by_name=actor.name,
            verified_at=now,
            created_at=now,
            updated_at=now,
        )
        db.session.add(verification)

    incident.status_code = "CLOSED"
    incident.close_reason_code = data.get("reasonCode") or "OTHER"
    incident.updated_at = now

    _add_history(
        incident,
        from_status=from_status,
        to_status="CLOSED",
        actor=actor,
        reason=reason,
        now=now,
    )
    _add_audit(
        incident,
        actor=actor,
        action="REPORT_CLOSED",
        previous=from_status,
        new="CLOSED",
        reason=reason,
        now=now,
        metadata={"reasonCode": incident.close_reason_code},
    )
    _add_notification(
        incident,
        type_code="REPORT_CLOSED",
        title="Report closed",
        body=f"{incident.reference} closed: {reason}.",
        now=now,
    )
    db.session.commit()
    return incident_to_dict(incident)


def start_response(incident_id: str, data: dict[str, Any], actor: User) -> dict[str, Any]:
    _require_admin(actor)
    department_ids = list(dict.fromkeys(data.get("departmentIds") or []))
    if not department_ids:
        abort(400, message="Select at least one department to start response.")

    incident = get_incident_or_404(incident_id)
    _require_mutable(incident)
    assert_can_transition(incident.status_code, "IN_PROGRESS")

    now = _utcnow()
    from_status = incident.status_code
    notes = (data.get("notes") or "").strip() or None
    parsed_ids: list[UUID] = []

    for raw_id in department_ids:
        try:
            dept_id = UUID(str(raw_id))
        except ValueError:
            abort(400, message="Invalid department id.")
        department = db.session.get(Department, dept_id)
        if department is None:
            abort(404, message=f"Department {raw_id} was not found.")
        if not department.active:
            abort(409, message=f"{department.name} is inactive.")
        parsed_ids.append(dept_id)

        existing = db.session.scalar(
            select(IncidentDepartmentHandoff).where(
                IncidentDepartmentHandoff.incident_id == incident.id,
                IncidentDepartmentHandoff.department_id == dept_id,
            )
        )
        if existing is not None:
            abort(
                409,
                message=f"{department.name} is already assigned to this incident.",
            )

        handoff = IncidentDepartmentHandoff(
            incident_id=incident.id,
            department_id=dept_id,
            initiated_by_id=actor.id,
            initiated_by_name=actor.name,
            status_code="PENDING",
            notes=notes,
            handed_off_at=now,
            updated_at=now,
        )
        db.session.add(handoff)
        db.session.flush()
        _add_audit(
            incident,
            actor=actor,
            action="DEPARTMENT_ASSIGNED",
            previous=None,
            new=department.name,
            reason=notes,
            now=now,
            metadata={"handoffId": str(handoff.id), "departmentId": str(dept_id)},
        )
        _add_notification(
            incident,
            type_code="DEPARTMENT_ASSIGNED",
            title="Department assigned",
            body=f"{department.name} assigned to {incident.reference}.",
            now=now,
            channel="EMAIL",
        )

    incident.status_code = "IN_PROGRESS"
    incident.updated_at = now
    _add_history(
        incident,
        from_status=from_status,
        to_status="IN_PROGRESS",
        actor=actor,
        reason=notes or "Response started",
        now=now,
    )
    _add_audit(
        incident,
        actor=actor,
        action="RESPONSE_STARTED",
        previous=from_status,
        new="IN_PROGRESS",
        reason=notes,
        now=now,
        metadata={"departmentIds": [str(i) for i in parsed_ids]},
    )
    _add_notification(
        incident,
        type_code="RESPONSE_STARTED",
        title="Response started",
        body=f"{incident.reference} is now in progress.",
        now=now,
    )
    db.session.commit()
    return incident_to_dict(incident)


def resolve_incident(incident_id: str, data: dict[str, Any], actor: User) -> dict[str, Any]:
    _require_admin(actor)
    summary = data["summary"].strip()
    if not summary:
        abort(400, message="A resolution summary is required.")

    incident = get_incident_or_404(incident_id)
    _require_mutable(incident)
    assert_can_transition(incident.status_code, "RESOLVED")

    now = _utcnow()
    from_status = incident.status_code
    notes = (data.get("notes") or "").strip() or None
    outcome = data["outcome"]
    complete_handoffs = data.get("completeHandoffs", True)
    if complete_handoffs is None:
        complete_handoffs = True

    if complete_handoffs:
        handoffs = db.session.scalars(
            select(IncidentDepartmentHandoff).where(
                IncidentDepartmentHandoff.incident_id == incident.id
            )
        ).all()
        for handoff in handoffs:
            if handoff.status_code in ("COMPLETED", "CANCELLED"):
                continue
            handoff.status_code = "COMPLETED"
            handoff.completed_at = now
            handoff.updated_at = now

    incident.status_code = "RESOLVED"
    incident.resolution_summary = summary
    incident.resolution_notes = notes
    incident.resolution_outcome_code = outcome
    incident.resolved_by_id = actor.id
    incident.resolved_by_name = actor.name
    incident.resolved_at = now
    incident.updated_at = now

    notify = data.get("notifyCitizen") or {}
    notify_sms = bool(notify.get("sms"))
    notify_email = bool(notify.get("email"))

    _add_history(
        incident,
        from_status=from_status,
        to_status="RESOLVED",
        actor=actor,
        reason=summary,
        now=now,
    )
    _add_audit(
        incident,
        actor=actor,
        action="INCIDENT_RESOLVED",
        previous=from_status,
        new="RESOLVED",
        reason=summary,
        now=now,
        metadata={
            "outcome": outcome,
            "notifyCitizen": {"sms": notify_sms, "email": notify_email},
        },
    )
    _add_notification(
        incident,
        type_code="INCIDENT_RESOLVED",
        title="Incident resolved",
        body=f"{incident.reference} marked resolved.",
        now=now,
    )

    citizen_body = (
        f"Your report {incident.reference} has been resolved. {summary}"
        + (" - Ajali! Operations" if incident.reporter_name else "")
    )
    channels: list[tuple[str, str]] = []
    if notify_sms:
        channels.append(("SMS", incident.reporter_phone or "no phone on file"))
    if notify_email:
        channels.append(("EMAIL", incident.reporter_email or "no email on file"))

    for channel, destination in channels:
        _add_notification(
            incident,
            type_code="CITIZEN_STATUS_NOTIFY",
            title=f"Citizen notified ({channel})",
            body=f"Queued {channel} to {destination}: {citizen_body}",
            now=now,
            channel=channel,
            recipient_id=incident.reporter_id,
        )
        _add_audit(
            incident,
            actor=actor,
            action="CITIZEN_NOTIFIED",
            previous=None,
            new=channel,
            reason=f"Resolution status notified via {channel}",
            now=now,
            metadata={"destination": destination, "channel": channel},
        )

    db.session.commit()
    return incident_to_dict(incident)


def reopen_incident(incident_id: str, reason: str, actor: User) -> dict[str, Any]:
    _require_admin(actor)
    clean_reason = reason.strip()
    if not clean_reason:
        abort(400, message="A reopen reason is required.")

    incident = get_incident_or_404(incident_id)
    _require_mutable(incident)

    if incident.status_code == "RESOLVED":
        to_status = "IN_PROGRESS"
    elif incident.status_code == "CLOSED":
        to_status = "PENDING"
    else:
        abort(
            409,
            message=f"Cannot reopen an incident with status {incident.status_code}.",
        )

    assert_can_transition(incident.status_code, to_status)
    now = _utcnow()
    from_status = incident.status_code

    incident.status_code = to_status
    incident.updated_at = now
    if to_status == "PENDING":
        incident.close_reason_code = None

    notif_type = (
        "STATUS_IN_PROGRESS" if to_status == "IN_PROGRESS" else "REPORT_RECEIVED"
    )
    _add_history(
        incident,
        from_status=from_status,
        to_status=to_status,
        actor=actor,
        reason=clean_reason,
        now=now,
    )
    _add_audit(
        incident,
        actor=actor,
        action="INCIDENT_REOPENED",
        previous=from_status,
        new=to_status,
        reason=clean_reason,
        now=now,
    )
    _add_notification(
        incident,
        type_code=notif_type,
        title=f"Incident reopened to {to_status}",
        body=f"{incident.reference} moved from {from_status} to {to_status}.",
        now=now,
    )
    db.session.commit()
    return incident_to_dict(incident)
