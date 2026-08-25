from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.middleware.auth import get_current_user, role_required
from app.schemas.incident import (
    ArchiveIncidentSchema,
    CreateIncidentSchema,
    HandoffSchema,
    IncidentListItemSchema,
    IncidentListQuerySchema,
    IncidentSchema,
    MediaSchema,
    NoteSchema,
    StatusHistorySchema,
    UpdateIncidentSchema,
    VerificationSchema,
)
from app.services import incident_service

blp = Blueprint(
    "Incidents",
    "incidents",
    url_prefix="/api/v1/incidents",
    description=(
        "Incident CRUD and lifecycle actions used by citizen and admin clients. "
        "Create/update/archive do not change lifecycle status — use moderation endpoints for that."
    ),
)


@blp.route("/active")
class ActiveIncidentsResource(MethodView):
    @blp.response(200, IncidentSchema(many=True))
    def get(self):
        """Public active map: IN_PROGRESS, non-archived."""
        return incident_service.list_active()


@blp.route("/community")
class CommunityIncidentsResource(MethodView):
    @blp.response(200, IncidentSchema(many=True))
    def get(self):
        """Citizen community feed: VERIFIED / IN_PROGRESS / RESOLVED."""
        return incident_service.list_community()


@blp.route("")
class IncidentListResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(IncidentListQuerySchema, location="query")
    @blp.response(200, IncidentListItemSchema(many=True))
    def get(self, query_args):
        """List incidents (admins: all; citizens: own reports)."""
        actor = get_current_user()
        return incident_service.list_incidents(query_args, actor)

    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(CreateIncidentSchema)
    @blp.response(201, IncidentSchema)
    def post(self, data):
        """Create a PENDING incident (atomic history + audit + notification)."""
        return incident_service.create_incident(data, get_current_user())


@blp.route("/verification-statuses")
class VerificationStatusesResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    def get(self):
        """Map of incidentId → latest verification status (admin)."""
        return incident_service.verification_status_map()


@blp.route("/<incident_id>")
class IncidentResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, IncidentSchema)
    def get(self, incident_id):
        """Return one incident."""
        actor = get_current_user()
        return incident_service.get_incident_dict(incident_id, actor)

    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(UpdateIncidentSchema)
    @blp.response(200, IncidentSchema)
    def patch(self, data, incident_id):
        """Update incident metadata (status is not changed here)."""
        return incident_service.update_incident(incident_id, data, get_current_user())


@blp.route("/<incident_id>/archive")
class IncidentArchiveResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(ArchiveIncidentSchema)
    @blp.response(200, IncidentSchema)
    def post(self, data, incident_id):
        """Soft-archive an incident (admin only)."""
        return incident_service.archive_incident(
            incident_id, data["reason"], get_current_user()
        )


@blp.route("/<incident_id>/notes")
class IncidentNotesResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, NoteSchema(many=True))
    def get(self, incident_id):
        return incident_service.list_notes(incident_id, get_current_user())


@blp.route("/<incident_id>/media")
class IncidentMediaResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, MediaSchema(many=True))
    def get(self, incident_id):
        return incident_service.list_media(incident_id, get_current_user())


@blp.route("/<incident_id>/history")
class IncidentHistoryResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, StatusHistorySchema(many=True))
    def get(self, incident_id):
        return incident_service.list_history(incident_id, get_current_user())


@blp.route("/<incident_id>/verifications")
class IncidentVerificationsResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, VerificationSchema(many=True))
    def get(self, incident_id):
        return incident_service.list_verifications(incident_id, get_current_user())


@blp.route("/<incident_id>/verification")
class IncidentVerificationResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, VerificationSchema)
    def get(self, incident_id):
        row = incident_service.get_latest_verification(incident_id, get_current_user())
        if row is None:
            from flask_smorest import abort

            abort(404, message="No verification record for this incident.")
        return row


@blp.route("/<incident_id>/handoffs")
class IncidentHandoffsResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, HandoffSchema(many=True))
    def get(self, incident_id):
        return incident_service.list_handoffs_for_incident(
            incident_id, get_current_user()
        )
