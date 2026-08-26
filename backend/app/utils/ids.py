"""Kenyan national ID helpers (mirror frontend auth.ts)."""

from __future__ import annotations


def normalize_id_number(raw: str | None) -> str | None:
    if not raw:
        return None
    digits = "".join(ch for ch in raw if ch.isdigit())
    return digits or None


def is_valid_id_number(raw: str | None) -> bool:
    digits = normalize_id_number(raw)
    return bool(digits and 7 <= len(digits) <= 8)
