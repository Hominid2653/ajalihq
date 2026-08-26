"""Pagination helpers for list endpoints."""

from __future__ import annotations

from typing import Any


DEFAULT_LIMIT = 50
MAX_LIMIT = 200


def parse_pagination(args: dict[str, Any]) -> tuple[int, int]:
    """Return (limit, offset) from query args."""
    try:
        limit = int(args.get("limit") if args.get("limit") is not None else DEFAULT_LIMIT)
    except (TypeError, ValueError):
        limit = DEFAULT_LIMIT
    try:
        offset = int(args.get("offset") if args.get("offset") is not None else 0)
    except (TypeError, ValueError):
        offset = 0
    limit = max(1, min(limit, MAX_LIMIT))
    offset = max(0, offset)
    return limit, offset


def page_payload(items: list[Any], *, total: int, limit: int, offset: int) -> dict[str, Any]:
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "hasMore": offset + len(items) < total,
    }
