"""Admin read aggregations."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from flask_smorest import abort
from sqlalchemy import func, select

from app.extensions import db
from app.models import AuditLog, Incident, IncidentDepartmentHandoff
from app.utils.serialize import audit_to_dict


def dashboard_stats() -> dict[str, Any]:
    base = select(Incident).where(Incident.archived.is_(False))
    incidents = db.session.scalars(base).all()

    def count(pred) -> int:
        return sum(1 for item in incidents if pred(item))

    today = datetime.now(timezone.utc).date().isoformat()
    awaiting_handoff = db.session.scalar(
        select(func.count())
        .select_from(IncidentDepartmentHandoff)
        .join(Incident, Incident.id == IncidentDepartmentHandoff.incident_id)
        .where(
            Incident.archived.is_(False),
            IncidentDepartmentHandoff.status_code == "PENDING",
        )
    ) or 0

    return {
        "total": len(incidents),
        "pending": count(lambda i: i.status_code == "PENDING"),
        "verified": count(lambda i: i.status_code == "VERIFIED"),
        "inProgress": count(lambda i: i.status_code == "IN_PROGRESS"),
        "resolved": count(lambda i: i.status_code == "RESOLVED"),
        "closed": count(lambda i: i.status_code == "CLOSED"),
        "criticalUrgency": count(lambda i: i.urgency_code == "CRITICAL"),
        "criticalSeverity": count(lambda i: i.severity_code == "CRITICAL"),
        "awaitingVerification": count(lambda i: i.status_code == "PENDING"),
        "awaitingResponse": count(lambda i: i.status_code == "VERIFIED"),
        "awaitingHandoffAck": int(awaiting_handoff),
        "today": count(
            lambda i: i.created_at.astimezone(timezone.utc).date().isoformat() == today
            if i.created_at.tzinfo
            else i.created_at.date().isoformat() == today
        ),
    }


def list_audit_logs(*, incident_id: str | None = None) -> list[dict[str, Any]]:
    stmt = select(AuditLog)
    if incident_id:
        try:
            uid = UUID(incident_id)
        except ValueError:
            abort(400, message="Invalid incidentId.")
        stmt = stmt.where(AuditLog.incident_id == uid)
    stmt = stmt.order_by(AuditLog.created_at.desc())
    return [audit_to_dict(row) for row in db.session.scalars(stmt).all()]
