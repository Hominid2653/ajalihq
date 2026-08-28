from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.middleware.auth import get_current_user, role_required
from app.schemas.department import (
    CreateDepartmentSchema,
    DepartmentListQuerySchema,
    DepartmentSchema,
    UpdateDepartmentSchema,
)
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

    @role_required("ADMIN")
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(CreateDepartmentSchema)
    @blp.response(201, DepartmentSchema)
    def post(self, data):
        return department_service.create_department(data, get_current_user())


@blp.route("/<department_id>")
class DepartmentResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, DepartmentSchema)
    def get(self, department_id):
        return department_service.get_department(department_id)

    @role_required("ADMIN")
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(UpdateDepartmentSchema)
    @blp.response(200, DepartmentSchema)
    def patch(self, data, department_id):
        return department_service.update_department(
            department_id, data, get_current_user()
        )


@blp.route("/<department_id>/activate")
class DepartmentActivateResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, DepartmentSchema)
    def post(self, department_id):
        return department_service.set_department_active(
            department_id, True, get_current_user()
        )


@blp.route("/<department_id>/deactivate")
class DepartmentDeactivateResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, DepartmentSchema)
    def post(self, department_id):
        return department_service.set_department_active(
            department_id, False, get_current_user()
        )
