from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.middleware.auth import get_current_user
from app.schemas.notification import NotificationSchema
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
    @blp.response(200, NotificationSchema(many=True))
    def get(self):
        return notification_service.list_notifications(get_current_user())
