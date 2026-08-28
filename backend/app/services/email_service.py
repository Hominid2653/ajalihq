"""Resend email adapter — never import from Flask routes directly."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from flask import current_app

logger = logging.getLogger(__name__)


@dataclass
class EmailSendResult:
    status: str  # sent | dry_run | failed | skipped
    provider_id: str | None = None
    error: str | None = None
    detail: dict[str, Any] | None = None


def email_configured() -> bool:
    key = current_app.config.get("RESEND_API_KEY") or ""
    enabled = current_app.config.get("NOTIFICATIONS_EMAIL_ENABLED", True)
    return bool(enabled and key)


def send_email(*, to: str, subject: str, text: str, html: str | None = None) -> EmailSendResult:
    """Send via Resend, or dry-run when key missing / disabled."""
    to_clean = (to or "").strip()
    if not to_clean or "@" not in to_clean:
        return EmailSendResult(status="skipped", error="Missing or invalid destination email.")

    if not current_app.config.get("NOTIFICATIONS_EMAIL_ENABLED", True):
        logger.info("EMAIL dry_run (disabled): to=%s subject=%s", to_clean, subject)
        return EmailSendResult(status="dry_run", detail={"reason": "NOTIFICATIONS_EMAIL_ENABLED=false"})

    api_key = (current_app.config.get("RESEND_API_KEY") or "").strip()
    if not api_key:
        logger.info("EMAIL dry_run (no RESEND_API_KEY): to=%s subject=%s", to_clean, subject)
        return EmailSendResult(status="dry_run", detail={"reason": "RESEND_API_KEY not set"})

    from_addr = (
        current_app.config.get("RESEND_FROM_EMAIL") or "Ajali! <onboarding@resend.dev>"
    ).strip()

    try:
        import resend

        resend.api_key = api_key
        params: dict[str, Any] = {
            "from": from_addr,
            "to": [to_clean],
            "subject": subject,
            "text": text,
        }
        if html:
            params["html"] = html
        response = resend.Emails.send(params)
        provider_id = None
        if isinstance(response, dict):
            provider_id = response.get("id")
        else:
            provider_id = getattr(response, "id", None)
        logger.info("EMAIL sent via Resend id=%s to=%s", provider_id, to_clean)
        return EmailSendResult(status="sent", provider_id=str(provider_id) if provider_id else None)
    except Exception as exc:  # noqa: BLE001 — surface provider errors in metadata
        logger.exception("EMAIL send failed to=%s", to_clean)
        return EmailSendResult(status="failed", error=str(exc))
