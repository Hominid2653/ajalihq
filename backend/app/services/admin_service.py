"""Admin read aggregations."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from flask_smorest import abort
from sqlalchemy import func, select

from app.extensions import db
from app.models import AuditLog, Incident, IncidentDepartmentHandoff, User
from app.services.auth_service import user_to_auth_dict
from app.utils.pagination import page_payload, parse_pagination
from app.utils.serialize import audit_to_dict


def dashboard_stats() -> dict[str, Any]:
    """SQL aggregates — do not load all incidents into Python."""
    start_of_today = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    archived = Incident.archived.is_(False)

    row = db.session.execute(
        select(
            func.count().label("total"),
            func.count()
            .filter(Incident.status_code == "PENDING")
            .label("pending"),
            func.count()
            .filter(Incident.status_code == "VERIFIED")
            .label("verified"),
            func.count()
            .filter(Incident.status_code == "IN_PROGRESS")
            .label("in_progress"),
            func.count()
            .filter(Incident.status_code == "RESOLVED")
            .label("resolved"),
            func.count()
            .filter(Incident.status_code == "CLOSED")
            .label("closed"),
            func.count()
            .filter(Incident.urgency_code == "CRITICAL")
            .label("critical_urgency"),
            func.count()
            .filter(Incident.severity_code == "CRITICAL")
            .label("critical_severity"),
            func.count()
            .filter(Incident.created_at >= start_of_today)
            .label("today"),
        ).where(archived)
    ).one()

    awaiting_handoff = (
        db.session.scalar(
            select(func.count())
            .select_from(IncidentDepartmentHandoff)
            .join(Incident, Incident.id == IncidentDepartmentHandoff.incident_id)
            .where(
                Incident.archived.is_(False),
                IncidentDepartmentHandoff.status_code == "PENDING",
            )
        )
        or 0
    )

    pending = int(row.pending or 0)
    verified = int(row.verified or 0)
    return {
        "total": int(row.total or 0),
        "pending": pending,
        "verified": verified,
        "inProgress": int(row.in_progress or 0),
        "resolved": int(row.resolved or 0),
        "closed": int(row.closed or 0),
        "criticalUrgency": int(row.critical_urgency or 0),
        "criticalSeverity": int(row.critical_severity or 0),
        "awaitingVerification": pending,
        "awaitingResponse": verified,
        "awaitingHandoffAck": int(awaiting_handoff),
        "today": int(row.today or 0),
    }


def list_audit_logs(
    *,
    incident_id: str | None = None,
    limit: int | None = None,
    offset: int | None = None,
) -> dict[str, Any]:
    stmt = select(AuditLog)
    if incident_id:
        try:
            uid = UUID(incident_id)
        except ValueError:
            abort(400, message="Invalid incidentId.")
        stmt = stmt.where(AuditLog.incident_id == uid)
    stmt = stmt.order_by(AuditLog.created_at.desc())

    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = int(db.session.scalar(count_stmt) or 0)
    page_limit, page_offset = parse_pagination(
        {"limit": limit, "offset": offset}
    )
    rows = db.session.scalars(stmt.limit(page_limit).offset(page_offset)).all()
    return page_payload(
        [audit_to_dict(row) for row in rows],
        total=total,
        limit=page_limit,
        offset=page_offset,
    )


def list_users(
    *,
    limit: int | None = None,
    offset: int | None = None,
) -> dict[str, Any]:
    stmt = select(User).order_by(User.created_at.desc())
    total = int(db.session.scalar(select(func.count()).select_from(User)) or 0)
    page_limit, page_offset = parse_pagination(
        {"limit": limit, "offset": offset}
    )
    rows = db.session.scalars(stmt.limit(page_limit).offset(page_offset)).all()
    return page_payload(
        [user_to_auth_dict(row) for row in rows],
        total=total,
        limit=page_limit,
        offset=page_offset,
    )


def get_user(user_id: str) -> dict[str, Any]:
    try:
        uid = UUID(user_id)
    except ValueError:
        abort(400, message="Invalid user id.")
    user = db.session.get(User, uid)
    if user is None:
        abort(404, message="User not found.")
    return user_to_auth_dict(user)
