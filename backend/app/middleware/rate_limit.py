"""Simple in-process rate limiting for auth endpoints."""

from __future__ import annotations

import time
from collections import defaultdict, deque
from functools import wraps
from typing import Callable

from flask import current_app, request
from flask_smorest import abort

# key -> timestamps of recent hits
_hits: dict[str, deque[float]] = defaultdict(deque)


def rate_limit(*, limit: int, window_seconds: int) -> Callable:
    """Reject with 429 when ``limit`` requests are exceeded in ``window_seconds``."""

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if current_app.config.get("TESTING"):
                return fn(*args, **kwargs)

            identity = request.remote_addr or "unknown"
            payload = request.get_json(silent=True) or {}
            email = str(payload.get("email") or "").strip().lower()
            key = f"{fn.__module__}.{fn.__name__}:{email or identity}"
            now = time.monotonic()
            bucket = _hits[key]
            while bucket and now - bucket[0] > window_seconds:
                bucket.popleft()
            if len(bucket) >= limit:
                abort(429, message="Too many attempts. Try again shortly.")
            bucket.append(now)
            return fn(*args, **kwargs)

        return wrapper

    return decorator
