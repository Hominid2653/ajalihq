"""Current weather via Open-Meteo — same contract as frontend weather-api.ts."""

from __future__ import annotations

from typing import Any

from flask import current_app
from flask_smorest import abort

from app.services.openmeteo_client import public_get


def sanitize_coordinate(value: float, min_v: float, max_v: float) -> float | None:
    try:
        num = float(value)
    except (TypeError, ValueError):
        return None
    if not (min_v <= num <= max_v):
        return None
    return round(num, 4)


def _weather_summary(code: int | None) -> str:
    if code is None:
        return "Conditions unavailable"
    if code == 0:
        return "Clear"
    if code <= 3:
        return "Partly cloudy"
    if code <= 48:
        return "Fog"
    if code <= 57:
        return "Drizzle"
    if code <= 67:
        return "Rain"
    if code <= 77:
        return "Snow or ice"
    if code <= 82:
        return "Heavy rain"
    if code <= 86:
        return "Snow showers"
    if code <= 99:
        return "Thunderstorm"
    return "Mixed conditions"


def get_current_conditions(lat: float, lng: float) -> dict[str, Any]:
    """Mirror frontend fetchSiteConditions → GET /v1/forecast on api.open-meteo.com."""
    safe_lat = sanitize_coordinate(lat, -90, 90)
    safe_lng = sanitize_coordinate(lng, -180, 180)
    if safe_lat is None or safe_lng is None:
        abort(400, message="Coordinates are not valid.")

    base = current_app.config.get("WEATHER_API_BASE") or "https://api.open-meteo.com"
    raw = public_get(
        base,
        "/v1/forecast",
        {
            "latitude": safe_lat,
            "longitude": safe_lng,
            "current": "temperature_2m,weather_code,wind_speed_10m,precipitation",
            "timezone": "Africa/Nairobi",
            "wind_speed_unit": "kmh",
        },
    )
    if not isinstance(raw, dict):
        abort(502, message="Open-Meteo returned an unexpected weather payload.")

    current = raw.get("current") if isinstance(raw.get("current"), dict) else {}

    def _num(key: str) -> float | None:
        value = current.get(key)
        return float(value) if isinstance(value, (int, float)) else None

    code_raw = current.get("weather_code")
    code = int(code_raw) if isinstance(code_raw, (int, float)) else None

    return {
        "temperatureC": _num("temperature_2m"),
        "windKmh": _num("wind_speed_10m"),
        "precipitationMm": _num("precipitation"),
        "summary": _weather_summary(code),
        "provider": "open-meteo",
        "lat": safe_lat,
        "lng": safe_lng,
    }
