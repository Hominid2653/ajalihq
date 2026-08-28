from flask.views import MethodView
from flask_smorest import Blueprint

from app.middleware.rate_limit import rate_limit
from app.schemas.geo import (
    GeocodePlaceSchema,
    GeocodeSearchQuerySchema,
    ReverseGeocodeQuerySchema,
    SiteConditionsSchema,
    WeatherCurrentQuerySchema,
)
from app.services import geocode_service, weather_service

blp = Blueprint(
    "GeoWeather",
    "geo_weather",
    url_prefix="/api/v1",
    description=(
        "Open-Meteo proxies — **same public hosts as the frontend** "
        "(`geocoding-api.open-meteo.com`, `api.open-meteo.com`). "
        "No API key. Public routes — send only sanitized place names or rounded coordinates; "
        "never reporter PII or incident text. "
        "Env mirrors frontend: `GEOCODE_API_BASE` / `WEATHER_API_BASE` "
        "(defaults match `VITE_GEOCODE_API_BASE` / `VITE_WEATHER_API_BASE`)."
    ),
)


@blp.route("/geo/search")
class GeocodeSearchResource(MethodView):
    @blp.doc(
        description=(
            "Forward geocode (Kenya). Proxies Open-Meteo `GET /v1/search` "
            "(same as frontend `searchKenyanPlaces`). Try `q=Nairobi`."
        )
    )
    @blp.arguments(GeocodeSearchQuerySchema, location="query")
    @blp.response(200, GeocodePlaceSchema(many=True))
    @rate_limit(limit=60, window_seconds=60)
    def get(self, query_args):
        """Search Kenyan places by name."""
        return geocode_service.search_places(
            query_args["q"], limit=query_args.get("limit")
        )


@blp.route("/geo/reverse")
class GeocodeReverseResource(MethodView):
    @blp.doc(
        description=(
            "Reverse helper for a pin. Open-Meteo has no reverse geocoder "
            "(frontend does not either) — returns a Kenya-scoped coordinate label."
        )
    )
    @blp.arguments(ReverseGeocodeQuerySchema, location="query")
    @blp.response(200, GeocodePlaceSchema(many=True))
    @rate_limit(limit=60, window_seconds=60)
    def get(self, query_args):
        """Reverse geocode coordinates (label fallback)."""
        return geocode_service.reverse_geocode(
            query_args["lat"],
            query_args["lng"],
            limit=query_args.get("limit") or 1,
        )


@blp.route("/weather/current")
class WeatherCurrentResource(MethodView):
    @blp.doc(
        description=(
            "Current conditions at a pin. Proxies Open-Meteo `GET /v1/forecast` "
            "(same params as frontend `fetchSiteConditions`). "
            "Returns SiteConditions-shaped JSON."
        )
    )
    @blp.arguments(WeatherCurrentQuerySchema, location="query")
    @blp.response(200, SiteConditionsSchema)
    @rate_limit(limit=60, window_seconds=60)
    def get(self, query_args):
        """Current weather for coordinates."""
        return weather_service.get_current_conditions(
            query_args["lat"], query_args["lng"]
        )
