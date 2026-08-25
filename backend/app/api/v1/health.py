from flask.views import MethodView
from flask_smorest import Blueprint

from app.schemas.health import HealthSchema

blp = Blueprint(
    "Health",
    "health",
    url_prefix="/api/v1/health",
    description="Service availability for load balancers and local development.",
)


@blp.route("")
class HealthResource(MethodView):
    @blp.response(200, HealthSchema)
    def get(self):
        """Return API health status."""
        return {
            "status": "ok",
            "service": "ajali-api",
            "version": "v1",
        }
