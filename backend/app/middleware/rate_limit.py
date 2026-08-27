"""In-process sliding-window rate limiting for auth endpoints.

Dual keys (client IP + email when present) slow credential stuffing without
blocking normal Swagger / demo retries. Shared Redis limiting can replace this
later without changing route decorators.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from functools import wraps
from typing import Callable

from flask import current_app, jsonify, make_response, request
from flask_smorest import abort

_lock = threading.Lock()
# bucket key -> timestamps of recent hits (monotonic)
_hits: dict[str, deque[float]] = defaultdict(deque)

_DEFAULT_LIMITS = {
    "login": (10, 60),
    "register": (5, 60),
}


def reset_rate_limit_state() -> None:
    """Clear all buckets (tests only)."""
    with _lock:
        _hits.clear()


def _client_ip() -> str:
    return (request.remote_addr or "unknown").strip() or "unknown"


def _request_email() -> str:
    payload = request.get_json(silent=True) or {}
    return str(payload.get("email") or "").strip().lower()


def _resolve_budget(scope: str, limit: int | None, window_seconds: int | None) -> tuple[int, int]:
    defaults = _DEFAULT_LIMITS.get(scope, (10, 60))
    cfg_limit = current_app.config.get(f"AUTH_{scope.upper()}_RATE_LIMIT")
    cfg_window = current_app.config.get(f"AUTH_{scope.upper()}_RATE_WINDOW_SECONDS")
    resolved_limit = int(limit if limit is not None else (cfg_limit if cfg_limit is not None else defaults[0]))
    resolved_window = int(
        window_seconds
        if window_seconds is not None
        else (cfg_window if cfg_window is not None else defaults[1])
    )
    return max(1, resolved_limit), max(1, resolved_window)


def _prune(bucket: deque[float], now: float, window_seconds: int) -> None:
    while bucket and now - bucket[0] > window_seconds:
        bucket.popleft()


def _retry_after_seconds(bucket: deque[float], now: float, window_seconds: int) -> int:
    if not bucket:
        return window_seconds
    oldest = bucket[0]
    return max(1, int(window_seconds - (now - oldest)) + 1)


def _too_many_requests(retry_after: int):
    body = {
        "code": 429,
        "status": "Too Many Requests",
        "message": "Too many attempts. Try again shortly.",
    }
    response = make_response(jsonify(body), 429)
    response.headers["Retry-After"] = str(retry_after)
    abort(response)


def rate_limit(
    *,
    scope: str = "auth",
    limit: int | None = None,
    window_seconds: int | None = None,
) -> Callable:
    """Reject with 429 when IP or email exceeds the sliding window budget."""

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            enabled = current_app.config.get("RATE_LIMIT_ENABLED")
            if enabled is None:
                enabled = not current_app.config.get("TESTING", False)
            if not enabled:
                return fn(*args, **kwargs)

            max_hits, window = _resolve_budget(scope, limit, window_seconds)
            now = time.monotonic()
            email = _request_email()
            keys = [f"{scope}:ip:{_client_ip()}"]
            if email:
                keys.append(f"{scope}:email:{email}")

            with _lock:
                retry_after = window
                for key in keys:
                    bucket = _hits[key]
                    _prune(bucket, now, window)
                    if len(bucket) >= max_hits:
                        retry_after = _retry_after_seconds(bucket, now, window)
                        _too_many_requests(retry_after)
                for key in keys:
                    _hits[key].append(now)

            return fn(*args, **kwargs)

        return wrapper

    return decorator
