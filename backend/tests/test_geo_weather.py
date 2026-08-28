"""Open-Meteo geocode + weather proxy tests (mocked HTTP)."""

from unittest.mock import patch


def test_geo_search_requires_query(client):
    missing = client.get("/api/v1/geo/search")
    assert missing.status_code == 422

    short = client.get("/api/v1/geo/search?q=a")
    assert short.status_code == 422


def test_geo_search_maps_kenya_results(client, app):
    fake = {
        "results": [
            {
                "name": "Nairobi",
                "latitude": -1.286389,
                "longitude": 36.817223,
                "country_code": "KE",
                "admin1": "Nairobi County",
            },
            {
                "name": "Somewhere",
                "latitude": 1.0,
                "longitude": 1.0,
                "country_code": "US",
                "admin1": "Illinois",
            },
        ]
    }
    with app.app_context():
        with patch("app.services.geocode_service.public_get", return_value=fake):
            res = client.get("/api/v1/geo/search?q=Nairobi&limit=5")
    assert res.status_code == 200, res.get_json()
    body = res.get_json()
    assert len(body) == 1
    assert body[0]["label"].startswith("Nairobi")
    assert body[0]["countryCode"] == "KE"
    assert body[0]["lat"] == -1.28639


def test_weather_current_maps_conditions(client, app):
    fake = {
        "current": {
            "temperature_2m": 22.4,
            "wind_speed_10m": 18.0,
            "precipitation": 0.2,
            "weather_code": 3,
        }
    }
    with app.app_context():
        with patch("app.services.weather_service.public_get", return_value=fake):
            res = client.get("/api/v1/weather/current?lat=-1.2864&lng=36.8172")
    assert res.status_code == 200, res.get_json()
    body = res.get_json()
    assert body["temperatureC"] == 22.4
    assert body["windKmh"] == 18.0
    assert body["precipitationMm"] == 0.2
    assert body["summary"] == "Partly cloudy"
    assert body["provider"] == "open-meteo"


def test_weather_invalid_coords(client):
    res = client.get("/api/v1/weather/current?lat=999&lng=36")
    assert res.status_code == 400


def test_reverse_returns_coordinate_label(client):
    res = client.get("/api/v1/geo/reverse?lat=-1.2864&lng=36.8172")
    assert res.status_code == 200
    body = res.get_json()
    assert len(body) == 1
    assert body[0]["countryCode"] == "KE"
    assert body[0]["lat"] == -1.2864
