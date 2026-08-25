from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.schemas.department import DepartmentListQuerySchema, DepartmentSchema
from app.services import department_service

blp = Blueprint(
    "Departments",
    "departments",
    url_prefix="/api/v1/departments",
    description="Response departments.",
)


@blp.route("")
class DepartmentListResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(DepartmentListQuerySchema, location="query")
    @blp.response(200, DepartmentSchema(many=True))
    def get(self, query_args):
        return department_service.list_departments(
            active_only=bool(query_args.get("activeOnly"))
        )


@blp.route("/<department_id>")
class DepartmentResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, DepartmentSchema)
    def get(self, department_id):
        return department_service.get_department(department_id)
