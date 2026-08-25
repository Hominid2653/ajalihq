from flask.views import MethodView
from flask_smorest import Blueprint

from app.middleware.auth import role_required
from app.schemas.admin import AuditLogQuerySchema, AuditLogSchema, DashboardStatsSchema
from app.schemas.incident import HandoffSchema
from app.services import admin_service, incident_service

blp = Blueprint(
    "Admin",
    "admin",
    url_prefix="/api/v1/admin",
    description="Admin operations: dashboard stats, audit logs, handoff inbox.",
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
    @blp.response(200, AuditLogSchema(many=True))
    def get(self, query_args):
        return admin_service.list_audit_logs(incident_id=query_args.get("incidentId"))


@blp.route("/handoffs")
class AdminHandoffsResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, HandoffSchema(many=True))
    def get(self):
        """All department handoffs (ops inbox)."""
        return incident_service.list_all_handoffs()
