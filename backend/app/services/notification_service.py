"""Notification read queries."""

from __future__ import annotations

from typing import Any

from sqlalchemy import or_, select

from app.extensions import db
from app.models import Notification, User
from app.utils.serialize import notification_to_dict


def list_notifications(actor: User) -> list[dict[str, Any]]:
    """Admins see ops-wide (null recipient) + own; users see own only."""
    stmt = select(Notification)
    if actor.role_code == "ADMIN":
        stmt = stmt.where(
            or_(
                Notification.recipient_id.is_(None),
                Notification.recipient_id == actor.id,
            )
        )
    else:
        stmt = stmt.where(Notification.recipient_id == actor.id)
    stmt = stmt.order_by(Notification.created_at.desc())
    return [notification_to_dict(row) for row in db.session.scalars(stmt).all()]
