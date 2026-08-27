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
        "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
        "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
    }

    CORS_ORIGINS = _split_origins(
        os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
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

    API_TITLE = "Ajali! API"
    API_VERSION = "v1"
    OPENAPI_VERSION = "3.0.3"
    OPENAPI_URL_PREFIX = "/"
    OPENAPI_SWAGGER_UI_PATH = "/docs"
    OPENAPI_SWAGGER_UI_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"
    OPENAPI_REDOC_PATH = "/redoc"
    OPENAPI_REDOC_URL = (
        "https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"
    )
    API_SPEC_OPTIONS = {
        "info": {
            "description": (
                "REST API for Ajali! emergency incident reporting. "
                "All application routes are versioned under `/api/v1`. "
                "Citizens report incidents; admins review, verify, and coordinate response. "
                "Only IN_PROGRESS incidents appear on the public active map. "
                "Authenticate via `POST /api/v1/auth/login`, then click Authorize in Swagger "
                "and paste the `accessToken` as a Bearer JWT."
            )
        },
        "servers": [
            {
                "url": os.getenv("API_SERVER_URL", "http://127.0.0.1:5000"),
                "description": "Local development",
            }
        ],
        "components": {
            "securitySchemes": {
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT",
                    "description": (
                        "JWT from POST /api/v1/auth/login (`accessToken`). "
                        "Paste the raw token only — Swagger adds the Bearer prefix."
                    ),
                }
            }
        },
    }


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
