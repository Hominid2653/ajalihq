from flask.views import MethodView
from flask_smorest import Blueprint

from app.middleware.auth import get_current_user, role_required
from app.schemas.incident import (
    CompleteHandoffSchema,
    HandoffSchema,
    UpdateHandoffSchema,
)
from app.services import handoff_service

blp = Blueprint(
    "Handoffs",
    "handoffs",
    url_prefix="/api/v1/handoffs",
    description="Department handoff status updates.",
)


@blp.route("/<handoff_id>")
class HandoffResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(UpdateHandoffSchema)
    @blp.response(200, HandoffSchema)
    def patch(self, data, handoff_id):
        return handoff_service.update_handoff(handoff_id, data, get_current_user())


@blp.route("/<handoff_id>/complete")
class HandoffCompleteResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(CompleteHandoffSchema)
    @blp.response(200, HandoffSchema)
    def post(self, data, handoff_id):
        return handoff_service.complete_handoff(
            handoff_id, data.get("notes"), get_current_user()
        )
