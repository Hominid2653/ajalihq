from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.middleware.auth import get_current_user, role_required
from app.schemas.incident import (
    AddMediaSchema,
    AddNoteSchema,
    ArchiveIncidentSchema,
    CloseIncidentSchema,
    CreateIncidentSchema,
    HandoffSchema,
    IncidentDetailSchema,
    IncidentListPageSchema,
    IncidentListQuerySchema,
    IncidentSchema,
    MediaSchema,
    NoteSchema,
    ReopenIncidentSchema,
    ResolveIncidentSchema,
    StartResponseSchema,
    StatusHistorySchema,
    UpdateIncidentSchema,
    VerificationSchema,
    VerifyIncidentSchema,
)
from app.schemas.openapi_examples import (
    ADD_MEDIA,
    ADD_NOTE,
    ARCHIVE_INCIDENT,
    CLOSE_INCIDENT,
    CREATE_INCIDENT,
    HINT_ADMIN_ONLY,
    HINT_LIFECYCLE,
    HINT_PAGINATION,
    HINT_UUID_PATH,
    REOPEN_INCIDENT,
    RESOLVE_INCIDENT,
    START_RESPONSE,
    UPDATE_INCIDENT,
    VERIFY_INCIDENT,
)
from app.services import incident_service, lifecycle_service

blp = Blueprint(
    "Incidents",
    "incidents",
    url_prefix="/api/v1/incidents",
    description=(
        "Incident CRUD and lifecycle. "
        "Create/update/archive do **not** change status — use moderation endpoints. "
        f"{HINT_LIFECYCLE} "
        "Public routes: `/active`, `/community` (no auth; no reporter PII)."
    ),
)


@blp.route("/active")
class ActiveIncidentsResource(MethodView):
    @blp.doc(
        description=(
            "Public active map feed: `IN_PROGRESS`, non-archived. "
            "Reporter contact fields are null (privacy)."
        )
    )
    @blp.response(200, IncidentSchema(many=True))
    def get(self):
        """Public active map: IN_PROGRESS, non-archived (no reporter PII)."""
        return incident_service.list_active()


@blp.route("/community")
class CommunityIncidentsResource(MethodView):
    @blp.doc(
        description=(
            "Citizen community feed: VERIFIED / IN_PROGRESS / RESOLVED. "
            "No auth. Reporter PII stripped."
        )
    )
    @blp.response(200, IncidentSchema(many=True))
    def get(self):
        """Citizen community feed: VERIFIED / IN_PROGRESS / RESOLVED (no reporter PII)."""
        return incident_service.list_community()


@blp.route("")
class IncidentListResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            f"Paginated list. Admins see all; citizens see own reports. {HINT_PAGINATION} "
            "Filter by status, urgency, type, search, dates, etc."
        ),
    )
    @blp.arguments(IncidentListQuerySchema, location="query")
    @blp.response(200, IncidentListPageSchema)
    def get(self, query_args):
        """List incidents (admins: all; citizens: own reports). Paginated."""
        actor = get_current_user()
        return incident_service.list_incidents(query_args, actor)

    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            "Creates a **PENDING** incident with history + audit + notification in one transaction. "
            "Admin may set reporter fields for walk-in / phone reports."
        ),
    )
    @blp.arguments(CreateIncidentSchema, example=CREATE_INCIDENT)
    @blp.response(201, IncidentSchema)
    def post(self, data):
        """Create a PENDING incident (atomic history + audit + notification)."""
        return incident_service.create_incident(data, get_current_user())


@blp.route("/verification-statuses")
class VerificationStatusesResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Map of `incidentId → latest verification status`. {HINT_ADMIN_ONLY}",
    )
    def get(self):
        """Map of incidentId → latest verification status (admin)."""
        return incident_service.verification_status_map()


@blp.route("/<incident_id>/detail")
class IncidentDetailResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            "Aggregate for review/detail pages (one round-trip): "
            "incident + history + notes + media + verification(s) + handoffs. "
            f"{HINT_UUID_PATH}"
        ),
    )
    @blp.response(200, IncidentDetailSchema)
    def get(self, incident_id):
        """Incident + history + notes + media + verification + handoffs."""
        return incident_service.get_incident_detail(incident_id, get_current_user())


@blp.route("/<incident_id>")
class IncidentResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Single incident. {HINT_UUID_PATH}",
    )
    @blp.response(200, IncidentSchema)
    def get(self, incident_id):
        """Return one incident."""
        actor = get_current_user()
        return incident_service.get_incident_dict(incident_id, actor)

    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            "Partial metadata update. **Does not change status** — use verify/close/resolve. "
            f"{HINT_UUID_PATH}"
        ),
    )
    @blp.arguments(UpdateIncidentSchema, example=UPDATE_INCIDENT)
    @blp.response(200, IncidentSchema)
    def patch(self, data, incident_id):
        """Update incident metadata (status is not changed here)."""
        return incident_service.update_incident(incident_id, data, get_current_user())


@blp.route("/<incident_id>/archive")
class IncidentArchiveResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Soft-archive (not hard delete). Reason required. {HINT_ADMIN_ONLY}",
    )
    @blp.arguments(ArchiveIncidentSchema, example=ARCHIVE_INCIDENT)
    @blp.response(200, IncidentSchema)
    def post(self, data, incident_id):
        """Soft-archive an incident (admin only)."""
        return incident_service.archive_incident(
            incident_id, data["reason"], get_current_user()
        )


@blp.route("/<incident_id>/verify")
class IncidentVerifyResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"**PENDING → VERIFIED.** {HINT_LIFECYCLE} {HINT_ADMIN_ONLY}",
    )
    @blp.arguments(VerifyIncidentSchema, example=VERIFY_INCIDENT)
    @blp.response(200, IncidentSchema)
    def post(self, data, incident_id):
        """PENDING → VERIFIED."""
        return lifecycle_service.verify_incident(
            incident_id, data, get_current_user()
        )


@blp.route("/<incident_id>/close")
class IncidentCloseResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            "**PENDING|VERIFIED → CLOSED** (false/invalid). "
            f"{HINT_LIFECYCLE} {HINT_ADMIN_ONLY}"
        ),
    )
    @blp.arguments(CloseIncidentSchema, example=CLOSE_INCIDENT)
    @blp.response(200, IncidentSchema)
    def post(self, data, incident_id):
        """PENDING|VERIFIED → CLOSED."""
        return lifecycle_service.close_incident(
            incident_id, data, get_current_user()
        )


@blp.route("/<incident_id>/start-response")
class IncidentStartResponseResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            "**VERIFIED → IN_PROGRESS** and creates department handoffs. "
            "First `GET /api/v1/departments?activeOnly=true`, paste real UUIDs into `departmentIds`. "
            f"{HINT_ADMIN_ONLY}"
        ),
    )
    @blp.arguments(StartResponseSchema, example=START_RESPONSE)
    @blp.response(200, IncidentSchema)
    def post(self, data, incident_id):
        """VERIFIED → IN_PROGRESS with department handoffs."""
        return lifecycle_service.start_response(
            incident_id, data, get_current_user()
        )


@blp.route("/<incident_id>/resolve")
class IncidentResolveResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            "**IN_PROGRESS → RESOLVED.** "
            "Set `notifyCitizen.email: true` to send Resend email to reporter "
            "(dry-run without `RESEND_API_KEY`). "
            f"{HINT_ADMIN_ONLY}"
        ),
    )
    @blp.arguments(ResolveIncidentSchema, example=RESOLVE_INCIDENT)
    @blp.response(200, IncidentSchema)
    def post(self, data, incident_id):
        """IN_PROGRESS → RESOLVED."""
        return lifecycle_service.resolve_incident(
            incident_id, data, get_current_user()
        )


@blp.route("/<incident_id>/reopen")
class IncidentReopenResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            "**RESOLVED → IN_PROGRESS** or **CLOSED → PENDING**. "
            f"Reason required. {HINT_ADMIN_ONLY}"
        ),
    )
    @blp.arguments(ReopenIncidentSchema, example=REOPEN_INCIDENT)
    @blp.response(200, IncidentSchema)
    def post(self, data, incident_id):
        """RESOLVED → IN_PROGRESS or CLOSED → PENDING."""
        return lifecycle_service.reopen_incident(
            incident_id, data["reason"], get_current_user()
        )


@blp.route("/<incident_id>/notes")
class IncidentNotesResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Notes newest-first. {HINT_UUID_PATH}",
    )
    @blp.response(200, NoteSchema(many=True))
    def get(self, incident_id):
        """List notes (newest first)."""
        return incident_service.list_notes(incident_id, get_current_user())

    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}], description="Add an admin/citizen note.")
    @blp.arguments(AddNoteSchema, example=ADD_NOTE)
    @blp.response(201, NoteSchema)
    def post(self, data, incident_id):
        """Add note."""
        return incident_service.add_note(
            incident_id, data["body"], get_current_user()
        )


@blp.route("/<incident_id>/media")
class IncidentMediaResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}], description="List non-deleted media.")
    @blp.response(200, MediaSchema(many=True))
    def get(self, incident_id):
        """List media."""
        return incident_service.list_media(incident_id, get_current_user())

    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description="Attach media by URL (Storage upload comes later).",
    )
    @blp.arguments(AddMediaSchema, example=ADD_MEDIA)
    @blp.response(201, MediaSchema)
    def post(self, data, incident_id):
        """Add media."""
        return incident_service.add_media(incident_id, data, get_current_user())


@blp.route("/media/<media_id>")
class IncidentMediaItemResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Soft-delete media. Returns **204**. {HINT_UUID_PATH}",
    )
    @blp.response(204)
    def delete(self, media_id):
        """Soft-delete media."""
        removed = incident_service.remove_media(media_id, get_current_user())
        if not removed:
            from flask_smorest import abort

            abort(404, message="Media not found.")
        return "", 204


@blp.route("/<incident_id>/history")
class IncidentHistoryResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description="Status timeline (oldest first).",
    )
    @blp.response(200, StatusHistorySchema(many=True))
    def get(self, incident_id):
        """Status history."""
        return incident_service.list_history(incident_id, get_current_user())


@blp.route("/<incident_id>/verifications")
class IncidentVerificationsResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description="All verification records (newest first).",
    )
    @blp.response(200, VerificationSchema(many=True))
    def get(self, incident_id):
        """List verifications."""
        return incident_service.list_verifications(incident_id, get_current_user())


@blp.route("/<incident_id>/verification")
class IncidentVerificationResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description="Latest verification only. **404** if none.",
    )
    @blp.response(200, VerificationSchema)
    def get(self, incident_id):
        """Latest verification."""
        row = incident_service.get_latest_verification(incident_id, get_current_user())
        if row is None:
            from flask_smorest import abort

            abort(404, message="No verification record for this incident.")
        return row


@blp.route("/<incident_id>/handoffs")
class IncidentHandoffsResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description="Handoffs for one incident.",
    )
    @blp.response(200, HandoffSchema(many=True))
    def get(self, incident_id):
        """List handoffs for incident."""
        return incident_service.list_handoffs_for_incident(
            incident_id, get_current_user()
        )
