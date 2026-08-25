from flask_smorest import Blueprint

blp = Blueprint(
    "Incidents",
    "incidents",
    url_prefix="/api/v1/incidents",
    description=(
        "Incident CRUD and lifecycle actions used by citizen and admin clients. "
        "Planned: list/create/get/update, archive, verify, close, start response, "
        "resolve, reopen, notes, media, history, and GET /active."
    ),
)
