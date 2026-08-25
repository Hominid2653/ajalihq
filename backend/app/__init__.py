from flask import Flask, jsonify

from app.api.v1 import register_blueprints
from app.config import get_config
from app.extensions import cors, db, jwt, migrate, rest_api


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(get_config(config_name))
    app.url_map.strict_slashes = False

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )
    rest_api.init_app(app)

    from app import models as _models  # noqa: F401

    register_blueprints(rest_api)

    @app.get("/")
    def index():
        return jsonify(
            {
                "service": "Ajali! API",
                "docs": "/docs",
                "redoc": "/redoc",
                "openapi": "/openapi.json",
                "health": "/api/v1/health",
            }
        )

    return app
