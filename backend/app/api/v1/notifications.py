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
from app.services import notification_service

blp = Blueprint(
    "Notifications",
    "notifications",
    url_prefix="/api/v1/notifications",
    description="In-app notification inbox.",
)


@blp.route("")
class NotificationListResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(NotificationListQuerySchema, location="query")
    @blp.response(200, NotificationPageSchema)
    def get(self, query_args):
        return notification_service.list_notifications(
            get_current_user(),
            limit=query_args.get("limit"),
            offset=query_args.get("offset"),
        )


CREATE_NOTIFICATION_EXAMPLE = {
    "type": "CITIZEN_STATUS_NOTIFY",
    "channel": "EMAIL",
    "title": "Ajali! test",
    "body": "Hello from Ajali backend",
    "toEmail": "you@example.com",
    "incidentId": None,
    "recipientId": None,
}


@blp.route("")
class NotificationCreateResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            "Enqueue a notification. For `channel: EMAIL`, set `toEmail` "
            "(or `recipientId` with a user that has an email). "
            "Uses Resend after commit; dry-runs if `RESEND_API_KEY` is unset."
        ),
    )
    @blp.arguments(CreateNotificationSchema, example=CREATE_NOTIFICATION_EXAMPLE)
    @blp.response(201, NotificationSchema)
    def post(self, data):
        """Admin enqueue of SMS/EMAIL/IN_APP notification (ops)."""
        return notification_service.create_notification(data, get_current_user())


@blp.route("/read-all")
class NotificationReadAllResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, MarkAllReadResponseSchema)
    def post(self):
        count = notification_service.mark_all_as_read(get_current_user())
        return {"count": count}


@blp.route("/<notification_id>/read")
class NotificationReadResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, NotificationSchema)
    def post(self, notification_id):
        return notification_service.mark_as_read(notification_id, get_current_user())
