"""HTTP helper for public Open-Meteo APIs (same hosts as the frontend)."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any
from urllib.parse import urlparse

from flask import current_app
from flask_smorest import abort

logger = logging.getLogger(__name__)

ALLOWED_HOSTS = frozenset(
    {
        "geocoding-api.open-meteo.com",
        "api.open-meteo.com",
    }
)


def _validate_base(base: str) -> str:
    cleaned = (base or "").strip().rstrip("/")
    parsed = urlparse(cleaned)
    if parsed.scheme != "https":
        abort(500, message="External API base must use HTTPS.")
    host = (parsed.hostname or "").lower()
    if host not in ALLOWED_HOSTS:
        abort(500, message=f"External API host not allow-listed: {host}")
    return cleaned


def public_get(base_url: str, path: str, params: dict[str, Any]) -> Any:
    """GET JSON from an allow-listed Open-Meteo base (no API key)."""
    base = _validate_base(base_url)
    timeout = float(current_app.config.get("OPEN_METEO_TIMEOUT_SECONDS") or 8)
    url = f"{base}{path}?{urllib.parse.urlencode(params)}"
    logger.info("Open-Meteo GET %s%s params=%s", base, path, params)

    request = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "AjaliHQ/1.0"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        body = ""
        try:
            body = exc.read().decode("utf-8", errors="replace")[:300]
        except Exception:  # noqa: BLE001
            pass
        logger.warning("Open-Meteo HTTP %s: %s", exc.code, body)
        if exc.code == 404:
            abort(404, message="Open-Meteo found no data for that request.")
        if exc.code == 429:
            abort(429, message="Open-Meteo rate limit exceeded. Try again shortly.")
        abort(502, message="Open-Meteo request failed.")
    except urllib.error.URLError as exc:
        logger.warning("Open-Meteo network error: %s", exc)
        abort(502, message="Could not reach Open-Meteo.")
    except json.JSONDecodeError:
        abort(502, message="Open-Meteo returned invalid JSON.")
