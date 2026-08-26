from flask_smorest import Api

from app.api.v1.admin import blp as admin_blp
from app.api.v1.auth import blp as auth_blp
from app.api.v1.departments import blp as departments_blp
from app.api.v1.handoffs import blp as handoffs_blp
from app.api.v1.health import blp as health_blp
from app.api.v1.incidents import blp as incidents_blp
from app.api.v1.notifications import blp as notifications_blp


def register_blueprints(api: Api) -> None:
    api.register_blueprint(health_blp)
    api.register_blueprint(auth_blp)
    api.register_blueprint(incidents_blp)
    api.register_blueprint(admin_blp)
    api.register_blueprint(departments_blp)
    api.register_blueprint(handoffs_blp)
    api.register_blueprint(notifications_blp)
