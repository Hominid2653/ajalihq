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
from app.schemas.openapi_examples import HINT_ADMIN_ONLY, HINT_PAGINATION, HINT_UUID_PATH
from app.services import admin_service, incident_service

blp = Blueprint(
    "Admin",
    "admin",
    url_prefix="/api/v1/admin",
    description=(
        "Admin operations: dashboard stats, audit logs, handoff inbox, users. "
        f"{HINT_ADMIN_ONLY}"
    ),
)


@blp.route("/dashboard")
class DashboardResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            "Live SQL aggregates (not a full table scan in Python). "
            f"{HINT_ADMIN_ONLY}"
        ),
    )
    @blp.response(200, DashboardStatsSchema)
    def get(self):
        """Operational dashboard counts from live incident data."""
        return admin_service.dashboard_stats()


@blp.route("/audit-logs")
class AuditLogsResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Append-only admin actions. {HINT_PAGINATION} Optional `incidentId` filter.",
    )
    @blp.arguments(AuditLogQuerySchema, location="query")
    @blp.response(200, AuditLogPageSchema)
    def get(self, query_args):
        """Paginated audit log."""
        return admin_service.list_audit_logs(
            incident_id=query_args.get("incidentId"),
            limit=query_args.get("limit"),
            offset=query_args.get("offset"),
        )


@blp.route("/handoffs")
class AdminHandoffsResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=(
            "Ops handoff inbox (all departments). "
            "Frontend `handoffApi.getAll` maps here — not `/api/v1/handoffs`."
        ),
    )
    @blp.response(200, HandoffSchema(many=True))
    def get(self):
        """All department handoffs (ops inbox)."""
        return incident_service.list_all_handoffs()


@blp.route("/users")
class AdminUsersResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"User roster for admin pickers. {HINT_PAGINATION}",
    )
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

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Fetch one user. {HINT_UUID_PATH}",
    )
    @blp.response(200, AuthUserSchema)
    def get(self, user_id):
        """Fetch one user by id (admin)."""
        return admin_service.get_user(user_id)
