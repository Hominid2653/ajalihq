# Ajali! API

Flask REST API for Ajali! emergency incident reporting. Interactive docs are generated from the same route declarations used by the app.

**API version:** all application routes live under `/api/v1`.

| Resource | URL |
| --- | --- |
| Swagger UI | http://127.0.0.1:5000/docs |
| ReDoc | http://127.0.0.1:5000/redoc |
| OpenAPI spec | http://127.0.0.1:5000/openapi.json |
| Health | http://127.0.0.1:5000/api/v1/health |
| Auth guide | [../docs/api-auth.md](../docs/api-auth.md) |

## Setup

1. Create a [Supabase](https://supabase.com) project (PostgreSQL).
2. Copy **Project Settings → Database → URI** into `backend/.env` as `DATABASE_URL`.
   Prefer the scheme `postgresql+psycopg://…` (the app also rewrites `postgres://` / `postgresql://`).

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env — set DATABASE_URL to your Supabase connection string
flask db upgrade
```

After changing models under `app/models/`:

```powershell
flask db migrate -m "Describe the change"
flask db upgrade
```

Seed lookup codes (idempotent):

```powershell
python -m scripts.seed_lookups
```

Seed demo accounts (Amina USER / Brian ADMIN, password `password`):

```powershell
python -m scripts.seed_demo_users
```

Seed departments + sample incidents (every status):

```powershell
python -m scripts.seed_demo_data
```

## Authentication (get a JWT)

See **[docs/api-auth.md](../docs/api-auth.md)** for full detail.

Quick path in Swagger:

1. `POST /api/v1/auth/login` with `{"email":"brian@ajalihq.test","password":"password"}`
2. Copy `accessToken`
3. Click **Authorize** → paste token into **BearerAuth**
4. Call protected endpoints (e.g. `GET /api/v1/auth/me`)

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
4. For protected routes: `@jwt_required()` and `@blp.doc(security=[{"BearerAuth": []}])`.
5. Restart Flask. The route appears in `/docs` automatically.

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

Versioned route prefixes:

- `/api/v1/auth`
- `/api/v1/incidents`
- `/api/v1/admin`
- `/api/v1/departments`
- `/api/v1/health`
