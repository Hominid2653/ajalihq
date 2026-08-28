from flask.views import MethodView
from flask_smorest import Blueprint

from app.schemas.health import HealthSchema

blp = Blueprint(
    "Health",
    "health",
    url_prefix="/api/v1/health",
    description="Service availability for load balancers and local development. No auth required.",
)


@blp.route("")
class HealthResource(MethodView):
    @blp.doc(description="Quick liveness check — useful before testing authenticated routes.")
    @blp.response(200, HealthSchema)
    def get(self):
        """Return API health status."""
        return {
            "status": "ok",
            "service": "ajali-api",
            "version": "v1",
        }
