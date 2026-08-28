"""Post-commit dispatch for EMAIL / SMS notification channels."""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from flask import current_app

from app.extensions import db
from app.models import Notification, User
from app.services import email_service

logger = logging.getLogger(__name__)

EXTERNAL_CHANNELS = frozenset({"EMAIL", "SMS"})


def _escape_html(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _merge_metadata(row: Notification, patch: dict[str, Any]) -> None:
    base = dict(row.metadata_ or {})
    base.update(patch)
    row.metadata_ = base


def _resolve_email_destination(row: Notification) -> str | None:
    meta = row.metadata_ or {}
    dest = meta.get("destination") or meta.get("to") or meta.get("toEmail")
    if isinstance(dest, str):
        cleaned = dest.strip()
        lower = cleaned.lower()
        if "@" in cleaned and "no email" not in lower and "on file" not in lower:
            return cleaned
    if row.recipient_id:
        user = db.session.get(User, row.recipient_id)
        if user and user.email:
            return user.email.strip()
    return None


def dispatch_notification(notification_id: UUID | str) -> dict[str, Any]:
    """Send one notification if channel is EMAIL (Resend) or SMS (deferred dry-run)."""
    try:
        uid = notification_id if isinstance(notification_id, UUID) else UUID(str(notification_id))
    except (TypeError, ValueError):
        return {"status": "skipped", "error": "Invalid notification id"}

    row = db.session.get(Notification, uid)
    if row is None:
        return {"status": "skipped", "error": "Notification not found"}

    channel = row.channel_code
    if channel == "IN_APP":
        return {"status": "skipped", "reason": "IN_APP"}

    if channel == "EMAIL":
        destination = _resolve_email_destination(row)
        if not destination:
            result = {
                "deliveryStatus": "skipped",
                "error": "No email destination on notification or recipient",
                "provider": "resend",
            }
            _merge_metadata(row, result)
            db.session.commit()
            return result

        send = email_service.send_email(
            to=destination,
            subject=row.title,
            text=row.body,
            html=f"<p>{_escape_html(row.body)}</p>",
        )
        result = {
            "deliveryStatus": send.status,
            "destination": destination,
            "provider": "resend",
            "providerId": send.provider_id,
            "error": send.error,
            "detail": send.detail,
        }
        _merge_metadata(row, {k: v for k, v in result.items() if v is not None})
        db.session.commit()
        return result

    if channel == "SMS":
        # Africa's Talking deferred — record dry-run only.
        enabled = current_app.config.get("NOTIFICATIONS_SMS_ENABLED", False)
        api_key = (current_app.config.get("AT_API_KEY") or "").strip()
        meta = row.metadata_ or {}
        destination = meta.get("destination") or meta.get("to")
        if not enabled or not api_key:
            result = {
                "deliveryStatus": "dry_run",
                "provider": "africas_talking",
                "destination": destination,
                "detail": {"reason": "SMS not wired yet or AT_API_KEY missing"},
            }
            _merge_metadata(row, {k: v for k, v in result.items() if v is not None})
            db.session.commit()
            logger.info("SMS dry_run notification=%s dest=%s", row.id, destination)
            return result
        result = {
            "deliveryStatus": "dry_run",
            "provider": "africas_talking",
            "detail": {"reason": "SMS adapter not implemented yet"},
        }
        _merge_metadata(row, result)
        db.session.commit()
        return result

    return {"status": "skipped", "reason": f"Unknown channel {channel}"}


def dispatch_notifications(notification_ids: list[UUID | str]) -> list[dict[str, Any]]:
    """Best-effort dispatch after the lifecycle/create transaction committed."""
    results: list[dict[str, Any]] = []
    for nid in notification_ids:
        try:
            results.append(dispatch_notification(nid))
        except Exception:  # noqa: BLE001
            logger.exception("Failed to dispatch notification %s", nid)
            results.append({"status": "failed", "id": str(nid)})
    return results
