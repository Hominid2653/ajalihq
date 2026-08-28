# Ajali! API authentication

All application routes are versioned under **`/api/v1`**. Protected endpoints expect a JWT in the `Authorization` header.

```http
Authorization: Bearer <accessToken>
```

## Demo accounts

Seed them first (from `backend/`):

```powershell
python -m scripts.seed_demo_users
```

| Email | Password | Role |
| --- | --- | --- |
| `amina@ajalihq.test` | `password` | USER |
| `brian@ajalihq.test` | `password` | ADMIN |

## Get a token (Swagger UI)

1. Start the API: `flask run --host 127.0.0.1 --port 5000`
2. Open [http://127.0.0.1:5000/docs](http://127.0.0.1:5000/docs)
3. Expand **Auth** → `POST /api/v1/auth/login`
4. Click **Try it out**, body example:

```json
{
  "email": "brian@ajalihq.test",
  "password": "password"
}
```

5. Execute. Copy `accessToken` from the response (not the whole JSON).
6. Click **Authorize** (top of Swagger), paste the token into **BearerAuth**, confirm.
7. Call protected routes (e.g. `GET /api/v1/auth/me`). Swagger sends `Authorization: Bearer …` automatically.

## Get a token (curl / PowerShell)

```powershell
$body = @{ email = "brian@ajalihq.test"; password = "password" } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:5000/api/v1/auth/login -ContentType "application/json" -Body $body
$token = $login.accessToken
$token

Invoke-RestMethod -Uri http://127.0.0.1:5000/api/v1/auth/me -Headers @{ Authorization = "Bearer $token" }
```

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"brian@ajalihq.test","password":"password"}' \
  | jq -r .accessToken)

curl -s http://127.0.0.1:5000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Auth endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | No | Create a citizen (`USER`) account |
| `POST` | `/api/v1/auth/login` | No | Return `{ accessToken, user }` |
| `GET` | `/api/v1/auth/me` | Bearer | Current user (`AuthUser` shape) |

Register always creates `role: USER`. Admins are created via seed (or a future admin invite flow).

Tokens expire after **12 hours** (`JWT_ACCESS_TOKEN_EXPIRES`). Set a long random `JWT_SECRET_KEY` (≥ 32 characters) in `backend/.env`.

## Read endpoints (Phase 3)

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/api/v1/incidents/active` | Public (`IN_PROGRESS`) |
| `GET` | `/api/v1/incidents/community` | Public |
| `GET` | `/api/v1/incidents` | Bearer (USER: own; ADMIN: all) |
| `GET` | `/api/v1/incidents/{id}` | Bearer |
| `GET` | `/api/v1/incidents/{id}/notes` | Bearer |
| `GET` | `/api/v1/incidents/{id}/media` | Bearer |
| `GET` | `/api/v1/incidents/{id}/history` | Bearer |
| `GET` | `/api/v1/incidents/{id}/verifications` | Bearer |
| `GET` | `/api/v1/incidents/{id}/handoffs` | Bearer |
| `GET` | `/api/v1/admin/dashboard` | ADMIN |
| `GET` | `/api/v1/admin/audit-logs` | ADMIN |
| `GET` | `/api/v1/admin/handoffs` | ADMIN |
| `GET` | `/api/v1/departments` | Bearer |
| `GET` | `/api/v1/notifications` | Bearer |

## Write endpoints (Phase 4)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/v1/incidents` | Bearer | Creates `PENDING`; history + audit + notification |
| `PATCH` | `/api/v1/incidents/{id}` | Bearer | Metadata only — **no status change** |
| `POST` | `/api/v1/incidents/{id}/archive` | ADMIN | Soft archive + reason required |

## Lifecycle endpoints (Phase 5) — ADMIN only

| Method | Path | Transition |
| --- | --- | --- |
| `POST` | `/api/v1/incidents/{id}/verify` | PENDING → VERIFIED |
| `POST` | `/api/v1/incidents/{id}/close` | PENDING\|VERIFIED → CLOSED |
| `POST` | `/api/v1/incidents/{id}/start-response` | VERIFIED → IN_PROGRESS (+ handoffs) |
| `POST` | `/api/v1/incidents/{id}/resolve` | IN_PROGRESS → RESOLVED |
| `POST` | `/api/v1/incidents/{id}/reopen` | RESOLVED → IN_PROGRESS or CLOSED → PENDING |

Each lifecycle write is one DB transaction: incident update + status history + audit log + notifications. Invalid transitions return **409**.

## Supporting writes (Phase 6)

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/api/v1/incidents/{id}/notes` | Bearer |
| `POST` | `/api/v1/incidents/{id}/media` | Bearer |
| `DELETE` | `/api/v1/incidents/media/{mediaId}` | Bearer (soft delete) |
| `PATCH` | `/api/v1/handoffs/{id}` | ADMIN |
| `POST` | `/api/v1/handoffs/{id}/complete` | ADMIN |
| `POST` | `/api/v1/departments` | ADMIN |
| `PATCH` | `/api/v1/departments/{id}` | ADMIN |
| `POST` | `/api/v1/departments/{id}/activate` | ADMIN |
| `POST` | `/api/v1/departments/{id}/deactivate` | ADMIN |
| `POST` | `/api/v1/notifications/{id}/read` | Bearer |
| `POST` | `/api/v1/notifications/read-all` | Bearer |

## API versioning

| Prefix | Use |
| --- | --- |
| `/api/v1/...` | Current stable application API |
| `/docs`, `/redoc`, `/openapi.json` | OpenAPI documentation (unversioned) |

New breaking changes ship under a new prefix (e.g. `/api/v2`) without removing `v1` until clients migrate.
