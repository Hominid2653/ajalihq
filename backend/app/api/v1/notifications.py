from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.middleware.auth import get_current_user, role_required
from app.schemas.notification import (
    CreateNotificationSchema,
    MarkAllReadResponseSchema,
    NotificationListQuerySchema,
    NotificationPageSchema,
    NotificationSchema,
)
from app.schemas.openapi_examples import (
    CREATE_NOTIFICATION_EMAIL,
    HINT_ADMIN_ONLY,
    HINT_PAGINATION,
    HINT_UUID_PATH,
)
from app.services import notification_service

blp = Blueprint(
    "Notifications",
    "notifications",
    url_prefix="/api/v1/notifications",
    description=(
        "In-app inbox + admin enqueue. "
        "EMAIL uses Resend after commit (dry-run if `RESEND_API_KEY` unset). "
        "SMS is deferred (dry-run). "
        f"{HINT_PAGINATION}"
    ),
)


@blp.route("")
class NotificationListResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            "Paginated inbox. ADMIN sees own + ops-wide (`recipient_id` null). "
            "Citizens see only their rows."
        ),
    )
    @blp.arguments(NotificationListQuerySchema, location="query")
    @blp.response(200, NotificationPageSchema)
    def get(self, query_args):
        """List notifications."""
        return notification_service.list_notifications(
            get_current_user(),
            limit=query_args.get("limit"),
            offset=query_args.get("offset"),
        )


@blp.route("")
class NotificationCreateResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            f"{HINT_ADMIN_ONLY} "
            "For `channel: EMAIL`, set `toEmail` to **your Resend account email** "
            "when using `onboarding@resend.dev`. "
            "Check response `deliveryStatus`: `sent` | `dry_run` | `failed` | `skipped`."
        ),
    )
    @blp.arguments(CreateNotificationSchema, example=CREATE_NOTIFICATION_EMAIL)
    @blp.response(201, NotificationSchema)
    def post(self, data):
        """Admin enqueue of SMS/EMAIL/IN_APP notification (ops)."""
        return notification_service.create_notification(data, get_current_user())


@blp.route("/read-all")
class NotificationReadAllResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description="Marks all visible unread notifications as read. Returns `{ count }`.",
    )
    @blp.response(200, MarkAllReadResponseSchema)
    def post(self):
        """Mark all as read."""
        count = notification_service.mark_all_as_read(get_current_user())
        return {"count": count}


@blp.route("/<notification_id>/read")
class NotificationReadResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Mark one notification read. {HINT_UUID_PATH}",
    )
    @blp.response(200, NotificationSchema)
    def post(self, notification_id):
        """Mark one as read."""
        return notification_service.mark_as_read(notification_id, get_current_user())
