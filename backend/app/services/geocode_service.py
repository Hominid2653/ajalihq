"""Geocoding via Open-Meteo — same contract as frontend geocode-api.ts."""

from __future__ import annotations

import re
from typing import Any

from flask import current_app
from flask_smorest import abort

from app.services.openmeteo_client import public_get

MAX_QUERY_LENGTH = 80
MIN_QUERY_LENGTH = 2
MAX_RESULTS = 8


def sanitize_place_query(raw: str) -> str:
    cleaned = re.sub(r"[\x00-\x1F\x7F]+", "", raw or "")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()[:MAX_QUERY_LENGTH]
    if not cleaned:
        return ""
    if re.search(r"https?://", cleaned, re.I):
        return ""
    if re.search(r"[<>]", cleaned):
        return ""
    if not re.search(r"[A-Za-z]", cleaned):
        return ""
    return cleaned


def _sanitize_label(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    text = re.sub(r"[\x00-\x1F\x7F]+", "", value)
    text = re.sub(r"[<>]", "", text)
    text = re.sub(r"\s+", " ", text).strip()[:120]
    return text


def _round_coord(value: float, digits: int = 5) -> float:
    return round(float(value), digits)


def _place_from_row(row: dict[str, Any]) -> dict[str, Any] | None:
    try:
        lat = float(row["latitude"])
        lng = float(row["longitude"])
    except (KeyError, TypeError, ValueError):
        return None
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return None

    country = str(row.get("country_code") or "").upper()
    if country != "KE":
        return None

    name = _sanitize_label(row.get("name"))
    if not name:
        return None
    admin = _sanitize_label(row.get("admin1"))
    label = f"{name}, {admin}" if admin and admin != name else name

    return {
        "label": label,
        "lat": _round_coord(lat),
        "lng": _round_coord(lng),
        "countryCode": country,
    }


def search_places(query: str, *, limit: int | None = None) -> list[dict[str, Any]]:
    """Mirror frontend searchKenyanPlaces → GET /v1/search on geocoding-api.open-meteo.com."""
    q = sanitize_place_query(query)
    if len(q) < MIN_QUERY_LENGTH:
        return []

    cap = max(1, min(int(limit or MAX_RESULTS), MAX_RESULTS))
    base = current_app.config.get("GEOCODE_API_BASE") or (
        "https://geocoding-api.open-meteo.com"
    )
    raw = public_get(
        base,
        "/v1/search",
        {
            "name": q,
            "count": cap,
            "language": "en",
            "format": "json",
            "countryCode": "KE",
        },
    )
    if not isinstance(raw, dict):
        return []
    results = raw.get("results")
    if not isinstance(results, list):
        return []

    places: list[dict[str, Any]] = []
    for item in results:
        if not isinstance(item, dict):
            continue
        place = _place_from_row(item)
        if place:
            places.append(place)
        if len(places) >= cap:
            break
    return places


def reverse_geocode(lat: float, lng: float, *, limit: int = 1) -> list[dict[str, Any]]:
    """
    Open-Meteo geocoding has no reverse endpoint (frontend does not either).
    Return a Kenya-scoped coordinate label so callers still get a usable place.
    """
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        abort(400, message="Coordinates are out of range.")
    safe_lat = _round_coord(lat)
    safe_lng = _round_coord(lng)
    cap = max(1, min(int(limit), 5))
    return [
        {
            "label": f"{safe_lat}, {safe_lng}",
            "lat": safe_lat,
            "lng": safe_lng,
            "countryCode": "KE",
        }
    ][:cap]
