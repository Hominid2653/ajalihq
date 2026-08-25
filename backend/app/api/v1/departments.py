from flask_smorest import Blueprint

blp = Blueprint(
    "Departments",
    "departments",
    url_prefix="/api/v1/departments",
    description="Response departments and later handoff assignment endpoints.",
)
