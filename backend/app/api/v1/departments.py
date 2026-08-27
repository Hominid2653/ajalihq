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
from app.schemas.openapi_examples import (
    CREATE_DEPARTMENT,
    HINT_ADMIN_ONLY,
    HINT_UUID_PATH,
    UPDATE_DEPARTMENT,
)
from app.services import department_service

blp = Blueprint(
    "Departments",
    "departments",
    url_prefix="/api/v1/departments",
    description=(
        "Response departments for start-response handoffs. "
        "List with `activeOnly=true` before calling start-response, then paste real UUIDs."
    ),
)


@blp.route("")
class DepartmentListResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description="List departments. Use `activeOnly=true` for dispatch pickers.",
    )
    @blp.arguments(DepartmentListQuerySchema, location="query")
    @blp.response(200, DepartmentSchema(many=True))
    def get(self, query_args):
        """List departments."""
        return department_service.list_departments(
            active_only=bool(query_args.get("activeOnly"))
        )

    @role_required("ADMIN")
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Create a department. {HINT_ADMIN_ONLY}",
    )
    @blp.arguments(CreateDepartmentSchema, example=CREATE_DEPARTMENT)
    @blp.response(201, DepartmentSchema)
    def post(self, data):
        """Create department (admin)."""
        return department_service.create_department(data, get_current_user())


@blp.route("/<department_id>")
class DepartmentResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Get one department. {HINT_UUID_PATH}",
    )
    @blp.response(200, DepartmentSchema)
    def get(self, department_id):
        """Get department by id."""
        return department_service.get_department(department_id)

    @role_required("ADMIN")
    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Partial update. {HINT_ADMIN_ONLY} {HINT_UUID_PATH}",
    )
    @blp.arguments(UpdateDepartmentSchema, example=UPDATE_DEPARTMENT)
    @blp.response(200, DepartmentSchema)
    def patch(self, data, department_id):
        """Update department (admin)."""
        return department_service.update_department(
            department_id, data, get_current_user()
        )


@blp.route("/<department_id>/activate")
class DepartmentActivateResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Set active=true. No body. {HINT_UUID_PATH}",
    )
    @blp.response(200, DepartmentSchema)
    def post(self, department_id):
        """Activate department."""
        return department_service.set_department_active(
            department_id, True, get_current_user()
        )


@blp.route("/<department_id>/deactivate")
class DepartmentDeactivateResource(MethodView):
    decorators = [role_required("ADMIN")]

    @blp.doc(
        security=[{"BearerAuth": []}],
        description=f"Set active=false. Inactive depts cannot be used in start-response. {HINT_UUID_PATH}",
    )
    @blp.response(200, DepartmentSchema)
    def post(self, department_id):
        """Deactivate department."""
        return department_service.set_department_active(
            department_id, False, get_current_user()
        )
