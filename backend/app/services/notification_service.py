"""Notification read/write queries."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from flask_smorest import abort
from sqlalchemy import func, or_, select

from app.extensions import db
from app.models import Incident, Notification, User
from app.services.notification_dispatch import EXTERNAL_CHANNELS, dispatch_notifications
from app.utils.pagination import page_payload, parse_pagination
from app.utils.serialize import notification_to_dict


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _visible_filter(actor: User):
    if actor.role_code == "ADMIN":
        return or_(
            Notification.recipient_id.is_(None),
            Notification.recipient_id == actor.id,
        )
    return Notification.recipient_id == actor.id


def list_notifications(
    actor: User,
    *,
    limit: int | None = None,
    offset: int | None = None,
) -> dict[str, Any]:
    stmt = (
        select(Notification)
        .where(_visible_filter(actor))
        .order_by(Notification.created_at.desc())
    )
    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = int(db.session.scalar(count_stmt) or 0)
    page_limit, page_offset = parse_pagination(
        {"limit": limit, "offset": offset}
    )
    rows = db.session.scalars(stmt.limit(page_limit).offset(page_offset)).all()
    return page_payload(
        [notification_to_dict(row) for row in rows],
        total=total,
        limit=page_limit,
        offset=page_offset,
    )


def mark_as_read(notification_id: str, actor: User) -> dict[str, Any]:
    try:
        uid = UUID(notification_id)
    except ValueError:
        abort(400, message="Invalid notification id.")

    row = db.session.scalar(
        select(Notification).where(
            Notification.id == uid,
            _visible_filter(actor),
        )
    )
    if row is None:
        exists = db.session.get(Notification, uid)
        if exists is None:
            abort(404, message="Notification not found.")
        abort(403, message="You do not have access to this notification.")

    if not row.read:
        row.read = True
        row.read_at = _utcnow()
        db.session.commit()
    return notification_to_dict(row)


def mark_all_as_read(actor: User) -> int:
    rows = db.session.scalars(
        select(Notification).where(_visible_filter(actor), Notification.read.is_(False))
    ).all()
    now = _utcnow()
    for row in rows:
        row.read = True
        row.read_at = now
    db.session.commit()
    return len(rows)


def create_notification(data: dict[str, Any], actor: User) -> dict[str, Any]:
    """Admin ops enqueue (SMS/EMAIL/IN_APP). EMAIL dispatches via Resend after commit."""
    if actor.role_code != "ADMIN":
        abort(403, message="Only admins can enqueue notifications.")

    incident_id = None
    if data.get("incidentId"):
        try:
            incident_id = UUID(str(data["incidentId"]))
        except ValueError:
            abort(400, message="Invalid incidentId.")
        if db.session.get(Incident, incident_id) is None:
            abort(400, message="Incident was not found.")

    recipient_id = None
    recipient: User | None = None
    if data.get("recipientId"):
        try:
            recipient_id = UUID(str(data["recipientId"]))
        except ValueError:
            abort(400, message="Invalid recipientId.")
        recipient = db.session.get(User, recipient_id)
        if recipient is None:
            abort(400, message="Recipient was not found.")

    channel = data["channel"]
    title = data["title"].strip()
    body = data["body"].strip()
    if not title or not body:
        abort(400, message="Title and body are required.")

    metadata: dict[str, Any] | None = None
    if channel in EXTERNAL_CHANNELS:
        destination = (data.get("toEmail") or data.get("to") or "").strip() or None
        if not destination and recipient and recipient.email:
            destination = recipient.email
        if channel == "SMS" and not destination and recipient and recipient.phone:
            destination = recipient.phone
        metadata = {
            "deliveryStatus": "pending",
            "destination": destination,
        }

    row = Notification(
        recipient_id=recipient_id,
        incident_id=incident_id,
        type_code=data["type"],
        channel_code=channel,
        title=title,
        body=body,
        read=False,
        created_at=_utcnow(),
        metadata_=metadata,
    )
    db.session.add(row)
    db.session.commit()

    if channel in EXTERNAL_CHANNELS:
        dispatch_notifications([row.id])
        db.session.refresh(row)

    return notification_to_dict(row)
