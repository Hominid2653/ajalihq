from flask_smorest import Blueprint

blp = Blueprint(
    "Departments",
    "departments",
    url_prefix="/api/departments",
    description="Response departments and later handoff assignment endpoints.",
)
