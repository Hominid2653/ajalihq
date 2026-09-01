"""Incident read/write queries."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from flask_smorest import abort
from sqlalchemy import Select, func, or_, select

from app.extensions import db
from app.models import (
    AuditLog,
    Incident,
    IncidentDepartmentHandoff,
    IncidentMedia,
    IncidentNote,
    IncidentStatusHistory,
    IncidentUrgency,
    Notification,
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
_REF_RE = re.compile(r"^AJL-(\d+)$")


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


def list_incidents(filters: dict[str, Any], actor: User) -> dict[str, Any]:
    from app.utils.pagination import page_payload, parse_pagination

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

    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = int(db.session.scalar(count_stmt) or 0)
    limit, offset = parse_pagination(filters)
    rows = db.session.execute(stmt.limit(limit).offset(offset)).all()
    items = [
        incident_to_dict(incident, verification_status=status or "PENDING")
        for incident, status in rows
    ]
    return page_payload(items, total=total, limit=limit, offset=offset)


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
    return [incident_to_dict(row, public=True) for row in rows]


def list_community() -> list[dict[str, Any]]:
    rows = db.session.scalars(
        select(Incident)
        .where(
            Incident.archived.is_(False),
            Incident.status_code.in_(COMMUNITY_STATUSES),
        )
        .order_by(Incident.updated_at.desc())
    ).all()
    return [incident_to_dict(row, public=True) for row in rows]


def list_notes(incident_id: str, actor: User) -> list[dict[str, Any]]:
    incident = get_incident_or_404(incident_id)
    ensure_can_view_incident(incident, actor)
    rows = db.session.scalars(
        select(IncidentNote)
        .where(IncidentNote.incident_id == incident.id)
        .order_by(IncidentNote.created_at.desc())
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
    """Single query: incident id → latest verification status (no N+1)."""
    latest = _latest_verification_subquery()
    rows = db.session.execute(
        select(
            Incident.id,
            func.coalesce(latest.c.status_code, "PENDING"),
        ).outerjoin(latest, latest.c.incident_id == Incident.id)
    ).all()
    return {str(incident_id): status for incident_id, status in rows}


def get_incident_detail(incident_id: str, actor: User) -> dict[str, Any]:
    """Aggregate for review/detail pages — one round-trip instead of 6–8."""
    incident = get_incident_dict(incident_id, actor)
    return {
        "incident": incident,
        "history": list_history(incident_id, actor),
        "notes": list_notes(incident_id, actor),
        "media": list_media(incident_id, actor),
        "verification": get_latest_verification(incident_id, actor),
        "verifications": list_verifications(incident_id, actor),
        "handoffs": list_handoffs_for_incident(incident_id, actor),
    }


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def next_reference() -> str:
    refs = db.session.scalars(select(Incident.reference)).all()
    highest = 0
    for ref in refs:
        match = _REF_RE.match(ref or "")
        if match:
            highest = max(highest, int(match.group(1)))
    return f"AJL-{highest + 1:04d}"


def ensure_can_edit_incident(incident: Incident, actor: User) -> None:
    if incident.archived:
        abort(409, message="Archived incidents cannot be edited.")
    if actor.role_code == "ADMIN":
        return
    if incident.reporter_id != actor.id:
        abort(403, message="You do not have permission to edit this incident.")


def create_incident(data: dict[str, Any], actor: User) -> dict[str, Any]:
    reporter_id = actor.id
    if data.get("userId"):
        requested = _parse_uuid(data["userId"], "userId")
        if actor.role_code != "ADMIN" and requested != actor.id:
            abort(403, message="Citizens can only create reports for themselves.")
        reporter_id = requested

    reporter = db.session.get(User, reporter_id)
    if reporter is None:
        abort(400, message="Reporter user was not found.")

    title = data["title"].strip()
    description = data["description"].strip()
    location = data["location"].strip()
    if not title or not description or not location:
        abort(400, message="Title, description, and location are required.")

    now = _utcnow()
    urgency = data.get("urgency") or "MEDIUM"
    incident = Incident(
        reference=next_reference(),
        title=title,
        description=description,
        type_code=data.get("type") or "accident",
        urgency_code=urgency,
        severity_code=data.get("severity") or "MODERATE",
        status_code="PENDING",
        location=location,
        lat=Decimal(str(data["lat"])) if data.get("lat") is not None else None,
        lng=Decimal(str(data["lng"])) if data.get("lng") is not None else None,
        reporter_id=reporter_id,
        reporter_name=(data.get("reporterName") or reporter.name or "").strip() or reporter.name,
        reporter_email=(data.get("reporterEmail") or reporter.email or "").strip()
        or reporter.email,
        reporter_phone=(
            (data.get("reporterPhone") or reporter.phone or "").strip() or reporter.phone
        ),
        preferred_contact_method=data.get("preferredContactMethod") or "PHONE",
        archived=False,
        created_at=now,
        updated_at=now,
    )
    db.session.add(incident)
    db.session.flush()

    db.session.add(
        IncidentStatusHistory(
            incident_id=incident.id,
            from_status_code=None,
            to_status_code="PENDING",
            actor_id=actor.id,
            actor_name=actor.name,
            reason="Incident created",
            created_at=now,
        )
    )
    db.session.add(
        AuditLog(
            incident_id=incident.id,
            incident_reference=incident.reference,
            entity_type="incident",
            entity_id=incident.id,
            actor_id=actor.id,
            actor_name=actor.name,
            action_code="REPORT_CREATED",
            new_value="PENDING",
            created_at=now,
        )
    )
    notif_type = (
        "CRITICAL_REPORT_RECEIVED" if urgency == "CRITICAL" else "REPORT_RECEIVED"
    )
    notif_title = (
        "Critical urgency report received"
        if urgency == "CRITICAL"
        else "New report received"
    )
    db.session.add(
        Notification(
            recipient_id=None,
            incident_id=incident.id,
            type_code=notif_type,
            channel_code="IN_APP",
            title=notif_title,
            body=f"{incident.reference}: {incident.title}",
            read=False,
            created_at=now,
        )
    )

    for item in data.get("media") or []:
        media = IncidentMedia(
            incident_id=incident.id,
            kind_code=item["kind"],
            url=item["url"].strip(),
            name=item["name"].strip(),
            uploaded_by_id=actor.id,
            created_at=now,
        )
        db.session.add(media)
        db.session.add(
            AuditLog(
                incident_id=incident.id,
                incident_reference=incident.reference,
                entity_type="incident",
                entity_id=incident.id,
                actor_id=actor.id,
                actor_name=actor.name,
                action_code="MEDIA_ADDED",
                new_value=media.name,
                created_at=now,
            )
        )

    db.session.commit()
    return incident_to_dict(incident)


def update_incident(
    incident_id: str, patch: dict[str, Any], actor: User
) -> dict[str, Any]:
    incident = get_incident_or_404(incident_id)
    ensure_can_edit_incident(incident, actor)

    before = incident_to_dict(incident)
    field_map = {
        "title": "title",
        "description": "description",
        "type": "type_code",
        "urgency": "urgency_code",
        "severity": "severity_code",
        "location": "location",
        "reporterName": "reporter_name",
        "reporterEmail": "reporter_email",
        "reporterPhone": "reporter_phone",
        "preferredContactMethod": "preferred_contact_method",
    }

    changed = False
    for api_key, column in field_map.items():
        if api_key not in patch or patch[api_key] is None:
            continue
        value = patch[api_key]
        if isinstance(value, str):
            value = value.strip()
        setattr(incident, column, value)
        changed = True

    if "lat" in patch:
        incident.lat = (
            Decimal(str(patch["lat"])) if patch["lat"] is not None else None
        )
        changed = True
    if "lng" in patch:
        incident.lng = (
            Decimal(str(patch["lng"])) if patch["lng"] is not None else None
        )
        changed = True

    if "userId" in patch and patch["userId"] is not None:
        if actor.role_code != "ADMIN":
            abort(403, message="Only admins can reassign the reporter.")
        new_reporter = _parse_uuid(patch["userId"], "userId")
        if db.session.get(User, new_reporter) is None:
            abort(400, message="Reporter user was not found.")
        incident.reporter_id = new_reporter
        changed = True

    if not changed:
        return incident_to_dict(incident)

    incident.updated_at = _utcnow()
    after = incident_to_dict(incident)
    prev_diff: dict[str, Any] = {}
    next_diff: dict[str, Any] = {}
    for key, old_val in before.items():
        new_val = after.get(key)
        if old_val != new_val:
            prev_diff[key] = old_val
            next_diff[key] = new_val
    db.session.add(
        AuditLog(
            incident_id=incident.id,
            incident_reference=incident.reference,
            entity_type="incident",
            entity_id=incident.id,
            actor_id=actor.id,
            actor_name=actor.name,
            action_code="REPORT_UPDATED",
            previous_value=json.dumps(prev_diff, default=str) if prev_diff else None,
            new_value=json.dumps(next_diff, default=str) if next_diff else None,
            created_at=incident.updated_at,
        )
    )
    db.session.commit()
    return after


def archive_incident(incident_id: str, reason: str, actor: User) -> dict[str, Any]:
    if actor.role_code != "ADMIN":
        abort(403, message="Only admins can archive incidents.")
    clean_reason = reason.strip()
    if not clean_reason:
        abort(400, message="An archive reason is required.")

    incident = get_incident_or_404(incident_id)
    if incident.archived:
        abort(409, message="Incident is already archived.")

    now = _utcnow()
    incident.archived = True
    incident.archive_reason = clean_reason
    incident.updated_at = now

    db.session.add(
        AuditLog(
            incident_id=incident.id,
            incident_reference=incident.reference,
            entity_type="incident",
            entity_id=incident.id,
            actor_id=actor.id,
            actor_name=actor.name,
            action_code="INCIDENT_ARCHIVED",
            previous_value="false",
            new_value="true",
            reason=clean_reason,
            created_at=now,
        )
    )
    db.session.add(
        Notification(
            recipient_id=None,
            incident_id=incident.id,
            type_code="INCIDENT_ARCHIVED",
            channel_code="IN_APP",
            title="Incident archived",
            body=f"{incident.reference} was archived.",
            read=False,
            created_at=now,
        )
    )
    db.session.commit()
    return incident_to_dict(incident)


def add_note(incident_id: str, body: str, actor: User) -> dict[str, Any]:
    incident = get_incident_or_404(incident_id)
    ensure_can_view_incident(incident, actor)
    clean = body.strip()
    if not clean:
        abort(400, message="Note body is required.")

    now = _utcnow()
    note = IncidentNote(
        incident_id=incident.id,
        author_id=actor.id,
        author_name=actor.name,
        body=clean,
        created_at=now,
        updated_at=now,
    )
    db.session.add(note)
    db.session.add(
        AuditLog(
            incident_id=incident.id,
            incident_reference=incident.reference,
            entity_type="incident",
            entity_id=incident.id,
            actor_id=actor.id,
            actor_name=actor.name,
            action_code="NOTE_ADDED",
            created_at=now,
        )
    )
    db.session.commit()
    return note_to_dict(note)


def add_media(
    incident_id: str, data: dict[str, Any], actor: User
) -> dict[str, Any]:
    incident = get_incident_or_404(incident_id)
    ensure_can_edit_incident(incident, actor)

    now = _utcnow()
    media = IncidentMedia(
        incident_id=incident.id,
        kind_code=data["kind"],
        url=data["url"].strip(),
        name=data["name"].strip(),
        uploaded_by_id=actor.id,
        created_at=now,
    )
    db.session.add(media)
    db.session.add(
        AuditLog(
            incident_id=incident.id,
            incident_reference=incident.reference,
            entity_type="incident",
            entity_id=incident.id,
            actor_id=actor.id,
            actor_name=actor.name,
            action_code="MEDIA_ADDED",
            new_value=media.name,
            created_at=now,
        )
    )
    db.session.commit()
    return media_to_dict(media)


def upload_incident_media(
    incident_id: str, file_storage: Any, actor: User
) -> dict[str, Any]:
    from app.services.storage_service import process_media_upload

    incident = get_incident_or_404(incident_id)
    ensure_can_edit_incident(incident, actor)

    upload_info = process_media_upload(file_storage, str(incident.id))
    now = _utcnow()
    media = IncidentMedia(
        incident_id=incident.id,
        kind_code=upload_info["kind"],
        url=upload_info["url"],
        name=upload_info["name"],
        storage_key=upload_info["storage_key"],
        mime_type=upload_info["mime_type"],
        byte_size=upload_info["byte_size"],
        uploaded_by_id=actor.id,
        created_at=now,
    )
    db.session.add(media)
    db.session.add(
        AuditLog(
            incident_id=incident.id,
            incident_reference=incident.reference,
            entity_type="incident",
            entity_id=incident.id,
            actor_id=actor.id,
            actor_name=actor.name,
            action_code="MEDIA_ADDED",
            new_value=media.name,
            created_at=now,
        )
    )
    db.session.commit()
    return media_to_dict(media)


def remove_media(media_id: str, actor: User) -> bool:
    try:
        uid = UUID(media_id)
    except ValueError:
        abort(400, message="Invalid media id.")
    media = db.session.get(IncidentMedia, uid)
    if media is None or media.deleted_at is not None:
        return False

    incident = db.session.get(Incident, media.incident_id)
    if incident is None:
        abort(404, message="Incident not found.")
    ensure_can_edit_incident(incident, actor)

    now = _utcnow()
    media.deleted_at = now
    db.session.add(
        AuditLog(
            incident_id=incident.id,
            incident_reference=incident.reference,
            entity_type="incident",
            entity_id=incident.id,
            actor_id=actor.id,
            actor_name=actor.name,
            action_code="MEDIA_REMOVED",
            previous_value=media.name,
            created_at=now,
        )
    )
    db.session.commit()
    return True


def stream_media_content(media_id: str, actor: User) -> tuple[bytes, str, str]:
    """Return raw bytes, mime type, and download filename for incident media."""
    from uuid import UUID

    from flask_smorest import abort

    from app.services.storage_service import fetch_stored_media_bytes

    try:
        uid = UUID(media_id)
    except ValueError:
        abort(400, message="Invalid media id.")

    media = db.session.get(IncidentMedia, uid)
    if media is None or media.deleted_at is not None:
        abort(404, message="Media not found.")

    incident = db.session.get(Incident, media.incident_id)
    if incident is None:
        abort(404, message="Incident not found.")
    ensure_can_view_incident(incident, actor)

    body, mime = fetch_stored_media_bytes(media.storage_key or "", media.url or "")
    filename = media.name or f"evidence-{media.id}"
    return body, mime, filename
