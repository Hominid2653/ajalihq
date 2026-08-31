import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Always load backend/.env so DATABASE_URL is available outside `flask` CLI.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def _split_origins(raw: str) -> list[str]:
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def _normalize_database_url(url: str) -> str:
    """Accept common Supabase / Heroku URI forms; force psycopg3 driver."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    JWT_TOKEN_LOCATION = ["headers"]

    # Default is local SQLite only as a last resort. Sprint 2+ uses Supabase Postgres.
    SQLALCHEMY_DATABASE_URI = _normalize_database_url(
        os.getenv("DATABASE_URL", "sqlite:///ajali.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
        "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
        "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
    }

    CORS_ORIGINS = _split_origins(
        os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,https://ajalihq.vercel.app,https://ajali.vercel.app",
        )
    )

    # External notifications (Resend email; Africa's Talking SMS later)
    RESEND_API_KEY = (os.getenv("RESEND_API_KEY") or "").strip()
    RESEND_FROM_EMAIL = (
        os.getenv("RESEND_FROM_EMAIL") or "Ajali! <onboarding@resend.dev>"
    ).strip()
    NOTIFICATIONS_EMAIL_ENABLED = (
        os.getenv("NOTIFICATIONS_EMAIL_ENABLED", "true").strip().lower()
        not in ("0", "false", "no")
    )
    # SMS deferred — keep env hooks for later wiring
    AT_USERNAME = (os.getenv("AT_USERNAME") or "").strip()
    AT_API_KEY = (os.getenv("AT_API_KEY") or "").strip()
    AT_SENDER_ID = (os.getenv("AT_SENDER_ID") or "").strip()
    NOTIFICATIONS_SMS_ENABLED = (
        os.getenv("NOTIFICATIONS_SMS_ENABLED", "false").strip().lower()
        in ("1", "true", "yes")
    )

    # Supabase Storage for incident media
    SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")
    SUPABASE_KEY = (
        os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or ""
    ).strip()
    SUPABASE_STORAGE_BUCKET = (
        os.getenv("SUPABASE_STORAGE_BUCKET") or "incident-media"
    ).strip()

    # Open-Meteo (same public bases as frontend VITE_GEOCODE_API_BASE / VITE_WEATHER_API_BASE)
    GEOCODE_API_BASE = (
        os.getenv("GEOCODE_API_BASE") or "https://geocoding-api.open-meteo.com"
    ).rstrip("/")
    WEATHER_API_BASE = (
        os.getenv("WEATHER_API_BASE") or "https://api.open-meteo.com"
    ).rstrip("/")
    OPEN_METEO_TIMEOUT_SECONDS = float(os.getenv("OPEN_METEO_TIMEOUT_SECONDS", "8"))

    API_TITLE = "Ajali! API"
    API_VERSION = "v1"
    OPENAPI_VERSION = "3.0.3"
    OPENAPI_URL_PREFIX = "/"
    OPENAPI_SWAGGER_UI_PATH = "/docs"
    OPENAPI_SWAGGER_UI_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"
    OPENAPI_REDOC_PATH = "/redoc"
    # Pin a stable release — `redoc@next` on jsDelivr currently 404s (blank ReDoc page).
    OPENAPI_REDOC_URL = (
        "https://cdn.jsdelivr.net/npm/redoc@2.5.0/bundles/redoc.standalone.js"
    )
    API_SPEC_OPTIONS = {
        "info": {
            "description": (
                "## Ajali! REST API (`/api/v1`)\n\n"
                "Citizens report incidents; admins review, verify, and coordinate response. "
                "Only **IN_PROGRESS** incidents appear on the public active map.\n\n"
                "### Swagger testing checklist\n\n"
                "1. **Health** — `GET /api/v1/health` (no auth).\n"
                "2. **Login** — `POST /api/v1/auth/login` with demo admin "
                "`brian@ajalihq.test` / `password` (or citizen `amina@ajalihq.test`).\n"
                "3. Copy `accessToken` → click **Authorize** → paste into **BearerAuth** "
                "(do not type `Bearer ` yourself).\n"
                "4. Call protected routes. Path params must be real UUIDs from list/create "
                "responses — never leave Swagger's placeholder `string`.\n"
                "5. Lifecycle: create (PENDING) → verify → start-response "
                "(paste department UUIDs from `GET /departments`) → resolve "
                "(optional `notifyCitizen.email` via Resend).\n"
                "6. Email test: `POST /api/v1/notifications` with `channel: EMAIL` and "
                "`toEmail` = your Resend account email.\n"
                "7. Geo/weather (Open-Meteo, same hosts as the frontend): "
                "`GET /api/v1/geo/search?q=Nairobi`, "
                "`GET /api/v1/weather/current?lat=-1.2864&lng=36.8172`.\n\n"
                "Invalid lifecycle transitions return **409**. "
                "Paginated lists return `{ items, total, limit, offset, hasMore }`."
            )
        },
        "components": {
            "securitySchemes": {
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT",
                    "description": (
                        "JWT from POST /api/v1/auth/login (`accessToken`). "
                        "Paste the raw token only — Swagger adds the Bearer prefix. "
                        "Demo: brian@ajalihq.test / password"
                    ),
                }
            }
        },
    }

    _server_url = (os.getenv("API_SERVER_URL") or "").strip().rstrip(",/")
    if _server_url and _server_url.startswith(("http://", "https://")):
        API_SPEC_OPTIONS["servers"] = [
            {"url": _server_url, "description": "API Server"}
        ]



class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-jwt-secret-key-at-least-32-bytes"
    # In-memory SQLite does not use a real connection pool.
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    RESEND_API_KEY = ""
    NOTIFICATIONS_EMAIL_ENABLED = True
    NOTIFICATIONS_SMS_ENABLED = False
    SUPABASE_URL = ""
    SUPABASE_KEY = ""
    GEOCODE_API_BASE = "https://geocoding-api.open-meteo.com"
    WEATHER_API_BASE = "https://api.open-meteo.com"


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(name: str | None = None) -> type[Config]:
    key = (name or os.getenv("FLASK_ENV", "development")).lower()
    return config_by_name.get(key, DevelopmentConfig)
