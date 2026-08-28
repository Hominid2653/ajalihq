"""Handoff update / complete."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from flask_smorest import abort

from app.extensions import db
from app.models import AuditLog, IncidentDepartmentHandoff, User
from app.utils.serialize import handoff_to_dict

HANDOFF_STATUSES = (
    "PENDING",
    "ACKNOWLEDGED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _require_admin(actor: User) -> None:
    if actor.role_code != "ADMIN":
        abort(403, message="Only admins can update handoffs.")


def get_handoff_or_404(handoff_id: str) -> IncidentDepartmentHandoff:
    try:
        uid = UUID(handoff_id)
    except ValueError:
        abort(400, message="Invalid handoff id.")
    row = db.session.get(IncidentDepartmentHandoff, uid)
    if row is None:
        abort(404, message="Handoff not found.")
    return row


def update_handoff(
    handoff_id: str, data: dict[str, Any], actor: User
) -> dict[str, Any]:
    _require_admin(actor)
    handoff = get_handoff_or_404(handoff_id)
    status = data["status"]
    if status not in HANDOFF_STATUSES:
        abort(400, message="Invalid handoff status.")

    now = _utcnow()
    previous = handoff.status_code
    handoff.status_code = status
    if "notes" in data and data["notes"] is not None:
        notes = data["notes"].strip()
        handoff.notes = notes or None
    if status in ("ACKNOWLEDGED", "IN_PROGRESS") and handoff.acknowledged_at is None:
        handoff.acknowledged_at = now
    if status == "COMPLETED":
        handoff.completed_at = now
    handoff.updated_at = now

    db.session.add(
        AuditLog(
            incident_id=handoff.incident_id,
            entity_type="incident",
            entity_id=handoff.incident_id,
            actor_id=actor.id,
            actor_name=actor.name,
            action_code="DEPARTMENT_HANDOFF_UPDATED",
            previous_value=previous,
            new_value=status,
            reason=(data.get("notes") or "").strip() or None,
            metadata_={
                "handoffId": str(handoff.id),
                "departmentId": str(handoff.department_id),
            },
            created_at=now,
        )
    )
    db.session.commit()
    return handoff_to_dict(handoff)


def complete_handoff(
    handoff_id: str, notes: str | None, actor: User
) -> dict[str, Any]:
    payload: dict[str, Any] = {"status": "COMPLETED"}
    if notes is not None:
        payload["notes"] = notes
    return update_handoff(handoff_id, payload, actor)
