# Ajali! API

Flask REST API for Ajali! emergency incident reporting. Interactive docs are generated from the same route declarations used by the app.

| Resource | URL |
| --- | --- |
| Swagger UI | http://127.0.0.1:5000/docs |
| ReDoc | http://127.0.0.1:5000/redoc |
| OpenAPI spec | http://127.0.0.1:5000/openapi.json |
| Health | http://127.0.0.1:5000/api/health |

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
flask db upgrade
```

After adding models under `app/models/`:

```powershell
flask db migrate -m "Describe the change"
flask db upgrade
```

## Run the development server

```powershell
flask run --host 127.0.0.1 --port 5000
```

Or:

```powershell
python wsgi.py
```

Production-style:

```powershell
gunicorn wsgi:app --bind 127.0.0.1:5000
```

## Tests

```powershell
python -m pytest
```

## Adding an endpoint

1. Create a Marshmallow schema in `app/schemas/`.
2. Add a `MethodView` on the matching blueprint in `app/api/v1/`.
3. Decorate with `@blp.arguments(...)` and `@blp.response(...)`.
4. Restart Flask. The route appears in `/docs` automatically.

Example:

```python
from flask.views import MethodView
from flask_smorest import abort

from app.api.v1.incidents import blp

@blp.route("/<incident_id>")
class IncidentResource(MethodView):
    @blp.response(200, IncidentSchema)
    def get(self, incident_id):
        """Return one incident."""
        incident = ...
        if incident is None:
            abort(404, message="Incident not found.")
        return incident
```

Route prefixes match the frontend service contracts:

- `/api/auth`
- `/api/incidents`
- `/api/admin`
- `/api/departments`
