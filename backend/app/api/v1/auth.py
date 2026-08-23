from flask_smorest import Blueprint

blp = Blueprint(
    "Auth",
    "auth",
    url_prefix="/api/auth",
    description=(
        "Citizen and admin authentication. "
        "Planned: POST /register, POST /login, GET /me."
    ),
)
