from flask_smorest import Blueprint

blp = Blueprint(
    "Admin",
    "admin",
    url_prefix="/api/admin",
    description=(
        "Admin operations. Planned: GET /dashboard, GET /audit-logs, GET /users."
    ),
)
