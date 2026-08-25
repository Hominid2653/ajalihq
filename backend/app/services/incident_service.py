"""Incident read queries."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from flask_smorest import abort
from sqlalchemy import Select, func, or_, select

from app.extensions import db
from app.models import (
    Incident,
    IncidentDepartmentHandoff,
    IncidentMedia,
    IncidentNote,
    IncidentStatusHistory,
    IncidentUrgency,
    ReporterVerification,
    User,
)
from app.utils.serialize import (
    handoff_to_dict,
    history_to_dict,
    incident_to_dict,
    media_to_dict,
    note_to_dict,
    verification_to_dict,
)

COMMUNITY_STATUSES = ("VERIFIED", "IN_PROGRESS", "RESOLVED")


def _parse_uuid(value: str, label: str = "id") -> UUID:
    try:
        return UUID(str(value))
    except (TypeError, ValueError):
        abort(400, message=f"Invalid {label}.")


def _latest_verification_subquery():
    """Subquery: latest verification row per incident by created_at."""
    ranked = (
        select(
            ReporterVerification.incident_id.label("incident_id"),
            ReporterVerification.status_code.label("status_code"),
            ReporterVerification.id.label("verification_id"),
            func.row_number()
            .over(
                partition_by=ReporterVerification.incident_id,
                order_by=ReporterVerification.created_at.desc(),
            )
            .label("rn"),
        )
    ).subquery()
    return (
        select(ranked.c.incident_id, ranked.c.status_code, ranked.c.verification_id)
        .where(ranked.c.rn == 1)
        .subquery()
    )


def latest_verification_status(incident_id: UUID) -> str:
    row = db.session.scalar(
        select(ReporterVerification)
        .where(ReporterVerification.incident_id == incident_id)
        .order_by(ReporterVerification.created_at.desc())
        .limit(1)
    )
    return row.status_code if row else "PENDING"


def get_incident_or_404(incident_id: str) -> Incident:
    uid = _parse_uuid(incident_id, "incident id")
    incident = db.session.get(Incident, uid)
    if incident is None:
        abort(404, message="Incident not found.")
    return incident


def ensure_can_view_incident(incident: Incident, actor: User) -> None:
    if actor.role_code == "ADMIN":
        return
    if incident.reporter_id != actor.id:
        abort(403, message="You do not have permission to view this incident.")


def list_incidents(filters: dict[str, Any], actor: User) -> list[dict[str, Any]]:
    latest = _latest_verification_subquery()
    stmt: Select[Any] = (
        select(Incident, latest.c.status_code)
        .outerjoin(latest, latest.c.incident_id == Incident.id)
        .outerjoin(IncidentUrgency, IncidentUrgency.code == Incident.urgency_code)
    )

    if not filters.get("includeArchived"):
        stmt = stmt.where(Incident.archived.is_(False))

    if actor.role_code != "ADMIN":
        stmt = stmt.where(Incident.reporter_id == actor.id)
    elif filters.get("userId"):
        stmt = stmt.where(Incident.reporter_id == _parse_uuid(filters["userId"], "userId"))

    if filters.get("status"):
        stmt = stmt.where(Incident.status_code == filters["status"])
    elif filters.get("statusIn"):
        stmt = stmt.where(Incident.status_code.in_(filters["statusIn"]))

    if filters.get("urgency"):
        stmt = stmt.where(Incident.urgency_code == filters["urgency"])
    if filters.get("severity"):
        stmt = stmt.where(Incident.severity_code == filters["severity"])
    if filters.get("type"):
        stmt = stmt.where(Incident.type_code == filters["type"])
    if filters.get("location"):
        loc = filters["location"].strip().lower()
        stmt = stmt.where(func.lower(Incident.location).contains(loc))
    if filters.get("search"):
        q = f"%{filters['search'].strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Incident.reference).like(q),
                func.lower(Incident.title).like(q),
                func.lower(Incident.location).like(q),
                func.lower(func.coalesce(Incident.reporter_name, "")).like(q),
            )
        )
    if filters.get("dateFrom"):
        stmt = stmt.where(Incident.created_at >= _parse_dt(filters["dateFrom"], end=False))
    if filters.get("dateTo"):
        stmt = stmt.where(Incident.created_at <= _parse_dt(filters["dateTo"], end=True))
    if filters.get("departmentId"):
        dept_id = _parse_uuid(filters["departmentId"], "departmentId")
        stmt = stmt.where(
            Incident.id.in_(
                select(IncidentDepartmentHandoff.incident_id).where(
                    IncidentDepartmentHandoff.department_id == dept_id
                )
            )
        )
    if filters.get("verificationStatus"):
        stmt = stmt.where(
            func.coalesce(latest.c.status_code, "PENDING") == filters["verificationStatus"]
        )

    if filters.get("sort") == "newest":
        stmt = stmt.order_by(Incident.created_at.desc())
    else:
        stmt = stmt.order_by(
            IncidentUrgency.rank.asc(),
            Incident.created_at.desc(),
        )

    rows = db.session.execute(stmt).all()
    return [
        incident_to_dict(incident, verification_status=status or "PENDING")
        for incident, status in rows
    ]


def _parse_dt(raw: str, *, end: bool) -> datetime:
    text = raw.strip()
    if end and "T" not in text:
        text = f"{text}T23:59:59.999Z"
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        abort(400, message="Invalid date filter.")


def get_incident_dict(incident_id: str, actor: User) -> dict[str, Any]:
    incident = get_incident_or_404(incident_id)
    ensure_can_view_incident(incident, actor)
    data = incident_to_dict(incident)
    latest = (
        db.session.scalars(
            select(ReporterVerification)
            .where(ReporterVerification.incident_id == incident.id)
            .order_by(ReporterVerification.created_at.desc())
            .limit(1)
        ).first()
    )
    if latest:
        data["verificationId"] = str(latest.id)
    return data


def list_active() -> list[dict[str, Any]]:
    rows = db.session.scalars(
        select(Incident)
        .where(
            Incident.archived.is_(False),
            Incident.status_code == "IN_PROGRESS",
        )
        .order_by(Incident.updated_at.desc())
    ).all()
    return [incident_to_dict(row) for row in rows]


def list_community() -> list[dict[str, Any]]:
    rows = db.session.scalars(
        select(Incident)
        .where(
            Incident.archived.is_(False),
            Incident.status_code.in_(COMMUNITY_STATUSES),
        )
        .order_by(Incident.updated_at.desc())
    ).all()
    return [incident_to_dict(row) for row in rows]


def list_notes(incident_id: str, actor: User) -> list[dict[str, Any]]:
    incident = get_incident_or_404(incident_id)
    ensure_can_view_incident(incident, actor)
    rows = db.session.scalars(
        select(IncidentNote)
        .where(IncidentNote.incident_id == incident.id)
        .order_by(IncidentNote.created_at.asc())
    ).all()
    return [note_to_dict(row) for row in rows]


def list_media(incident_id: str, actor: User) -> list[dict[str, Any]]:
    incident = get_incident_or_404(incident_id)
    ensure_can_view_incident(incident, actor)
    rows = db.session.scalars(
        select(IncidentMedia)
        .where(
            IncidentMedia.incident_id == incident.id,
            IncidentMedia.deleted_at.is_(None),
        )
        .order_by(IncidentMedia.created_at.asc())
    ).all()
    return [media_to_dict(row) for row in rows]


def list_history(incident_id: str, actor: User) -> list[dict[str, Any]]:
    incident = get_incident_or_404(incident_id)
    ensure_can_view_incident(incident, actor)
    rows = db.session.scalars(
        select(IncidentStatusHistory)
        .where(IncidentStatusHistory.incident_id == incident.id)
        .order_by(IncidentStatusHistory.created_at.asc())
    ).all()
    return [history_to_dict(row) for row in rows]


def list_verifications(incident_id: str, actor: User) -> list[dict[str, Any]]:
    incident = get_incident_or_404(incident_id)
    ensure_can_view_incident(incident, actor)
    rows = db.session.scalars(
        select(ReporterVerification)
        .where(ReporterVerification.incident_id == incident.id)
        .order_by(ReporterVerification.created_at.desc())
    ).all()
    return [verification_to_dict(row) for row in rows]


def get_latest_verification(incident_id: str, actor: User) -> dict[str, Any] | None:
    rows = list_verifications(incident_id, actor)
    return rows[0] if rows else None


def list_handoffs_for_incident(incident_id: str, actor: User) -> list[dict[str, Any]]:
    incident = get_incident_or_404(incident_id)
    ensure_can_view_incident(incident, actor)
    rows = db.session.scalars(
        select(IncidentDepartmentHandoff)
        .where(IncidentDepartmentHandoff.incident_id == incident.id)
        .order_by(IncidentDepartmentHandoff.handed_off_at.desc())
    ).all()
    return [handoff_to_dict(row) for row in rows]


def list_all_handoffs() -> list[dict[str, Any]]:
    rows = db.session.scalars(
        select(IncidentDepartmentHandoff).order_by(
            IncidentDepartmentHandoff.handed_off_at.desc()
        )
    ).all()
    return [handoff_to_dict(row) for row in rows]


def verification_status_map() -> dict[str, str]:
    incidents = db.session.scalars(select(Incident)).all()
    return {str(i.id): latest_verification_status(i.id) for i in incidents}
