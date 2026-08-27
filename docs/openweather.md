# Geo / weather proxies (Open-Meteo — same as frontend)

The frontend uses **Open-Meteo** with public bases (no API key):

```env
# frontend/.env.example
VITE_GEOCODE_API_BASE=https://geocoding-api.open-meteo.com
VITE_WEATHER_API_BASE=https://api.open-meteo.com
```

The Flask proxies use the **same hosts** (server-side allow-list):

```env
# backend/.env.example
GEOCODE_API_BASE=https://geocoding-api.open-meteo.com
WEATHER_API_BASE=https://api.open-meteo.com
OPEN_METEO_TIMEOUT_SECONDS=8
```

No vendor API key is required.

## Endpoints (public, no JWT)

| Method | Path | Upstream |
| --- | --- | --- |
| `GET` | `/api/v1/geo/search?q=Nairobi&limit=5` | `{GEOCODE}/v1/search` (Kenya) |
| `GET` | `/api/v1/geo/reverse?lat=&lng=` | Label fallback (Open-Meteo has no reverse; frontend neither) |
| `GET` | `/api/v1/weather/current?lat=&lng=` | `{WEATHER}/v1/forecast` current vars |

Response shapes match the frontend `GeocodePlace` / `SiteConditions` DTOs (`provider: "open-meteo"`).

## Why proxy?

- Centralize allow-listing / timeouts / rate limits
- Future: swap provider without rewriting React
- Keep PII off third-party requests (place string / coords only)

## Swagger

`/docs` → **GeoWeather**. Try `q=Nairobi` and `lat=-1.2864&lng=36.8172`.
