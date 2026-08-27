from flask.views import MethodView
from flask_smorest import Blueprint

from app.middleware.auth import get_current_user, role_required
from app.schemas.incident import (
    CompleteHandoffSchema,
    HandoffSchema,
    UpdateHandoffSchema,
)
from app.schemas.openapi_examples import (
    COMPLETE_HANDOFF,
    HINT_ADMIN_ONLY,
    HINT_UUID_PATH,
    UPDATE_HANDOFF,
)
from app.services import handoff_service

blp = Blueprint(
    "Handoffs",
    "handoffs",
    url_prefix="/api/v1/handoffs",
    description=(
        "Update a single handoff by id. "
        "To **list** all handoffs use `GET /api/v1/admin/handoffs`. "
        f"{HINT_ADMIN_ONLY}"
    ),
)


@blp.route("/<handoff_id>")
class HandoffResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            f"Update handoff status (ACKNOWLEDGED, IN_PROGRESS, …). {HINT_UUID_PATH} "
            "Get ids from incident detail or GET /api/v1/admin/handoffs."
        ),
    )
    @blp.arguments(UpdateHandoffSchema, example=UPDATE_HANDOFF)
    @blp.response(200, HandoffSchema)
    def patch(self, data, handoff_id):
        """Update handoff status."""
        return handoff_service.update_handoff(handoff_id, data, get_current_user())


@blp.route("/<handoff_id>/complete")
class HandoffCompleteResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Mark handoff COMPLETED. {HINT_UUID_PATH}",
    )
    @blp.arguments(CompleteHandoffSchema, example=COMPLETE_HANDOFF)
    @blp.response(200, HandoffSchema)
    def post(self, data, handoff_id):
        """Complete handoff."""
        return handoff_service.complete_handoff(
            handoff_id, data.get("notes"), get_current_user()
        )
