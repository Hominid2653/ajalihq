# AjaliHQ Backend Development Plan

## Goal

Replace the in-memory mock in `frontend/src/data/api.ts` with a **Flask REST API backed by Supabase PostgreSQL**, without rewriting Admin or citizen UI. Every write that changes incident state must be **atomic** (incident + status history + audit log + notifications in one transaction).

## Database decision

**Supabase PostgreSQL** is the system of record for Sprint 2+.

- Connection via `DATABASE_URL` (Supabase Session / Transaction pooler or direct).
- Prefer `postgresql+psycopg://…` (psycopg3).
- Flask uses the database connection string from Supabase project settings (service role / DB password — never expose in the frontend).
- Supabase Auth, Storage, and Realtime land in later phases; start with Postgres + Flask-JWT.

### Progress log

| Date | Milestone |
| --- | --- |
| 2026-08-25 | Plan saved. Phase 0: psycopg + Supabase URL normalization. Phase 1 started: SQLAlchemy models + initial Alembic migration + lookup seed script. |
| 2026-08-25 | Supabase connected. `flask db upgrade` applied `17e2b4e7a636`. Lookup seed complete. |
| 2026-08-25 | Phase 2a auth: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me` + JWT role claims. Demo users seeded. |
| 2026-08-25 | Phase 3 reads: incidents list/get/active/community + nested resources; admin dashboard/audit; departments; notifications. Demo incident seed. Next: Phase 4 CRUD/archive. |
| 2026-08-25 | Phase 4 writes: `POST/PATCH /api/v1/incidents`, `POST …/archive` with atomic audit/history/notifications. Next: Phase 5 lifecycle (verify/close/start/resolve/reopen). |
| 2026-08-25 | Phase 5 lifecycle: verify/close/start-response/resolve/reopen against `incident_status_transitions`. Next: Phase 6 supporting writes (notes/media/handoffs) or Phase 7 frontend wiring. |
| 2026-08-25 | Phase 6 supporting writes: notes/media, handoffs, department CRUD, notification read markers. Next: Phase 7 frontend → Flask. |
| 2026-08-25 | Pre–Phase 7 backend hardening (audit): PII strip on public feeds, pagination, detail bundle, dashboard SQL, PATCH `/auth/me`, admin users, rate limits, notes DESC. Frontend adapters → `.cursor/rules/frontend-flask-integration.mdc`. |
| 2026-08-27 | Auth rate limiting hardened: dual IP+email sliding windows on login/register, `Retry-After`, env-tuned budgets, pytest coverage. Demo-friendly defaults (10/min login, 5/min register). |

## Current baseline

| Layer | State |
| --- | --- |
| Frontend services | Stable contracts: `incidentApi`, `adminApi`, `departmentApi`, `handoffApi`, `notificationApi` |
| Mock data | Full lifecycle, audit, notifications in `frontend/src/data/api.ts` |
| Flask app | Factory, JWT, CORS, Smorest OpenAPI, blueprints **stubbed only** |
| Database | ERD complete (`docs/erd.dbml`); models/migrations to be built against Supabase |
| Tests | Only `test_health.py` |

## Architecture (target)

```text
React / PWA
    ↓  HTTP (Bearer JWT)
Flask REST API  (/api/*)
    ↓
Services (incident_service, notification_service, …)
    ↓
Repositories / SQLAlchemy
    ↓
Supabase PostgreSQL

Later:
  Supabase Auth  → login/register/me (or JWT bridge)
  Supabase Storage → media uploads
  Resend / Africa's Talking → email/SMS (stub first)
```

**Rule:** Routes stay thin; business logic lives in `backend/app/services/`. Lifecycle transitions validate against `incident_status_transitions` (same graph as frontend `STATUS_TRANSITIONS`).

---

## Phase 0 — Project setup

**Objective:** Runnable backend connected to Supabase Postgres.

1. Create / use Supabase project; copy connection string into `backend/.env` as `DATABASE_URL`.
2. Add `psycopg[binary]` to `requirements.txt`.
3. Keep SQLite/`:memory:` only for fast unit tests (`TestingConfig`).
4. Document: `flask db upgrade`, `flask run`, `pytest`.

**Done when:** `flask run` + `GET /api/health` works with Supabase Postgres configured.

---

## Phase 1 — Schema & seed data

**Objective:** Database matches `docs/erd.dbml` exactly.

1. SQLAlchemy models (lookups, users, incidents, handoffs, media, notes, history, notifications, audit).
2. Alembic initial migration; indexes per database rules.
3. Idempotent lookup seed from frontend unions.
4. Demo seed (Kenyan locations, ADMIN/USER demo accounts, every status).

**Done when:** `flask db upgrade` + seed scripts populate Supabase like Sprint 1 mock data.

---

## Phase 2 — Auth & authorization

**Phase 2a:** Flask-JWT-Extended + local `users.password_hash`.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/register` | Citizen signup |
| `POST /api/auth/login` | Access token + `AuthUser` shape |
| `GET /api/auth/me` | Current user from JWT |

- `@role_required("ADMIN")` for admin routes.
- JWT claims: `sub`, `role`, `email`.

**Phase 2b:** Bridge to Supabase Auth (same `/api/auth/*` contract).

**Done when:** USER gets 403 on admin routes; ADMIN gets 200.

---

## Phase 3 — Read APIs & serializers

1. Incidents: list (filters/pagination), get, active, community, nested notes/media/history/verifications.
2. Admin: dashboard stats, audit logs.
3. Departments & handoffs reads.
4. Notifications reads.
5. Marshmallow schemas → camelCase JSON matching `frontend/src/types/*`.

**Done when:** Seeded data via HTTP matches mock shapes.

---

## Phase 4 — Incident CRUD & archive

| Endpoint | Notes |
| --- | --- |
| `POST /api/incidents` | Default `PENDING`; generate `reference` |
| `PATCH /api/incidents/:id` | Metadata only — **no status via edit** |
| `POST /api/incidents/:id/archive` | Soft archive + audit |

**Done when:** Create/edit/archive work; archived excluded from default inbox.

---

## Phase 5 — Lifecycle engine (core)

One transaction per action:

```text
validate transition → update incident → status_history → audit_logs → notifications
(+ reporter_verifications on verify; handoffs on start-response)
```

| Endpoint | Transition |
| --- | --- |
| `POST …/verify` | PENDING → VERIFIED |
| `POST …/close` | PENDING → CLOSED |
| `POST …/start-response` | VERIFIED → IN_PROGRESS |
| `POST …/resolve` | IN_PROGRESS → RESOLVED |
| `POST …/reopen` | RESOLVED/CLOSED → prior |

Invalid transitions → 409. Pytest for matrix + rollback.

**Done when:** Admin demo verify → start response → resolve works end-to-end on Supabase.

---

## Phase 6 — Supporting write APIs

Notes, media (URL metadata first; Storage later), handoffs, departments, notification read markers.

---

## Phase 7 — Frontend integration

1. HTTP client + `VITE_API_BASE` + Bearer JWT.
2. Swap `data/api.ts` implementations; keep `incidentApi` etc.
3. Feature flag `VITE_USE_MOCK_API=false`.
4. Acceptance: 26 admin demo steps against Flask + Supabase.

---

## Phase 8 — External services & hardening

Geocode/weather proxy, email/SMS stubs, Supabase Storage, optional Realtime, RLS only if direct client access is added later.

---

## Phase 9 — Production readiness

Gunicorn, logging, rate limits, CORS lock, migration runbook, CI with Postgres.

---

## Suggested sprint calendar

| Sprint | Phases | Primary deliverable |
| --- | --- | --- |
| **Sprint 2.1** | 0, 1, 2a | Supabase + models + auth + seed |
| **Sprint 2.2** | 3, 4 | Read API + CRUD/archive |
| **Sprint 2.3** | 5, 6 | Lifecycle + notes/media/handoffs |
| **Sprint 2.4** | 7 | Frontend wired to Flask |
| **Sprint 2.5+** | 8, 9 | Storage, proxies, Supabase Auth, deploy |

---

## API route map

All application routes are versioned under **`/api/v1`**. Auth usage: [`docs/api-auth.md`](api-auth.md).

```text
/api/v1/auth/*           → login, register, me
/api/v1/incidents/*      → CRUD, lifecycle, notes, media, history, active, community
/api/v1/admin/*          → dashboard, audit-logs, users
/api/v1/departments/*    → department CRUD
/api/v1/notifications/*  → inbox + read markers
/api/v1/handoffs/*       → ops handoff updates (or nest under incidents)
/api/v1/health           → live
```

---

## Definition of done

1. No React component mutates audit/history/notifications directly.
2. Every status change creates history + audit + notification in one transaction.
3. `IN_PROGRESS` only on `/active`; archived hidden from default lists.
4. OpenAPI at `/docs` documents all endpoints.
5. pytest covers lifecycle transitions and auth RBAC.
6. Frontend services work with `VITE_USE_MOCK_API=false` against Supabase-backed Flask.

---

## Next action

**Phase 7:** Wire frontend services to Flask using `.cursor/rules/frontend-flask-integration.mdc` (JWT storage, page envelopes, path adapters). Keep `VITE_USE_MOCK_API` until cutover.
