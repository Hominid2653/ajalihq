from flask.views import MethodView
from flask_smorest import Blueprint

from app.middleware.auth import role_required
from app.schemas.admin import (
    AuditLogPageSchema,
    AuditLogQuerySchema,
    DashboardStatsSchema,
    PaginationQuerySchema,
    UserPageSchema,
)
from app.schemas.auth import AuthUserSchema
from app.schemas.incident import HandoffSchema
from app.services import admin_service, incident_service

blp = Blueprint(
    "Admin",
    "admin",
    url_prefix="/api/v1/admin",
    description="Admin operations: dashboard stats, audit logs, handoff inbox, users.",
)


@blp.route("/dashboard")
class DashboardResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, DashboardStatsSchema)
    def get(self):
        """Operational dashboard counts from live incident data."""
        return admin_service.dashboard_stats()


@blp.route("/audit-logs")
class AuditLogsResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(AuditLogQuerySchema, location="query")
    @blp.response(200, AuditLogPageSchema)
    def get(self, query_args):
        return admin_service.list_audit_logs(
            incident_id=query_args.get("incidentId"),
            limit=query_args.get("limit"),
            offset=query_args.get("offset"),
        )


@blp.route("/handoffs")
class AdminHandoffsResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, HandoffSchema(many=True))
    def get(self):
        """All department handoffs (ops inbox)."""
        return incident_service.list_all_handoffs()


@blp.route("/users")
class AdminUsersResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(PaginationQuerySchema, location="query")
    @blp.response(200, UserPageSchema)
    def get(self, query_args):
        """List users for admin roster / assignee pickers."""
        return admin_service.list_users(
            limit=query_args.get("limit"),
            offset=query_args.get("offset"),
        )


@blp.route("/users/<user_id>")
class AdminUserResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, AuthUserSchema)
    def get(self, user_id):
        """Fetch one user by id (admin)."""
        return admin_service.get_user(user_id)
