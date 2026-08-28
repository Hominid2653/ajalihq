# AjaliHQ Backend API Audit

**Date:** 2026-08-25  
**Scope:** Flask `/api/v1` vs frontend service contracts (`frontend/src/services/*`, `lib/auth.ts`, `data/api.ts`)  
**Purpose:** Identify contract gaps, performance risks, and realtime gaps **before** Phase 7 frontend wiring.  
**Status:** Backend P0/P1/perf fixes applied 2026-08-25. Frontend wiring deferred — see `.cursor/rules/frontend-flask-integration.mdc`.

---

## Executive summary

The backend covers most **incident lifecycle and admin ops** surface area, with correct atomic write patterns for status changes. It is **not yet a drop-in replacement** for `data/api.ts` without an adapter layer:

1. **Auth/session contract** differs (mock ignores password / returns user only; Flask requires password + JWT).
2. Several **frontend-called APIs are missing** (users, profile update, notification create).
3. **Detail/review pages** issue many parallel GETs; the API has no aggregate “detail bundle” and several list endpoints are **unbounded**.
4. There is **no realtime** path (neither frontend nor Flask). Admin “live” UX today is refetch-on-action / remount; wiring Flask alone will feel slower over the Supabase pooler unless we add caching, aggregation, or Realtime/SSE.

**Verdict:** Safe to wire with an adapter + known gaps; **do not** treat contracts as 1:1 identical. Fix the high-severity and auth mismatches first (or handle them explicitly in the HTTP client).

---

## 1. Frontend contract map vs backend

Legend: **OK** = present and roughly compatible · **ADAPTER** = present but shape/auth differs · **GAP** = missing or breaking · **N/A** = frontend-only / deferred by plan

### 1.1 Auth (`lib/auth.ts` + SignIn / SignUp)

| Frontend call | Backend | Fit | Notes |
| --- | --- | --- | --- |
| `authenticate(email, password?)` | `POST /api/v1/auth/login` | **ADAPTER** | Mock often ignores password (`SignInConfirmPage` / magic-link flow). Flask **requires** password. Login returns `{ accessToken, user }` not bare `AuthUser`. |
| `registerUser({ name, email, phone, … })` | `POST /api/v1/auth/register` | **ADAPTER** | UI collects password but `registerUser` **does not pass it** today. Flask requires `password` (min 8). Adapter must send password; optionally lower min length to match UI (6). |
| `fetchProfile(userId)` | — | **GAP** | No `GET /api/v1/users/:id`. Closest: `GET /api/v1/auth/me` (current user only). |
| `updateUserProfile(userId, patch)` | — | **GAP** | Used by `AccountPage`. No profile PATCH. |
| `findUserByEmail` / `apiGetUsers` | — | **GAP** | `adminApi.getUsers()` reserved; no backend route. |
| Session storage | JWT in memory/header | **ADAPTER** | Frontend persists `AuthUser` in localStorage without token. Wiring must store `accessToken` (+ refresh strategy later). |

### 1.2 Incidents (`incidentApi`)

| Frontend | Backend | Fit | Notes |
| --- | --- | --- | --- |
| `getAll(query)` | `GET /api/v1/incidents` | **OK / ADAPTER** | Filters largely mirrored. **No pagination.** `Actor` not sent (good — JWT). `statusIn` as repeated query params needs client care. |
| `getById` | `GET /api/v1/incidents/:id` | **OK** | Ownership: USER own only; ADMIN all. |
| `create(data, actor)` | `POST /api/v1/incidents` | **ADAPTER** | Drop `actor`; JWT supplies actor. `userId` optional (admin walk-in). |
| `update` / `updateUrgency` / `updateSeverity` | `PATCH /api/v1/incidents/:id` | **OK** | Status not changed via PATCH — matches mock. |
| `archive(id, reason, actor)` | `POST …/archive` | **OK** | ADMIN only (stricter than if mock allowed more). |
| `verify` / `close` / `startResponse` / `resolve` / `reopen` | matching `POST …/*` | **OK** | ADMIN only. Bodies camelCase-aligned. |
| `getHistory` / `getNotes` / `getMedia` / `getVerifications` / `getVerification` | nested GETs | **OK / ADAPTER** | **Notes sort:** mock = newest first; backend = oldest first. UI may look inverted. |
| `addNote` / `addMedia` / `removeMedia` | POST notes/media, DELETE media | **ADAPTER** | `removeMedia` mock returns `boolean`; API returns **204**. Adapter should map to `true`/`false`. Soft-delete on backend (good). |
| `getActive` / `getCommunity` | public GETs | **OK** | No auth — matches public map/community. |
| `getVerificationStatuses` | `GET …/verification-statuses` | **OK** | ADMIN only on backend. |

### 1.3 Admin (`adminApi`)

| Frontend | Backend | Fit |
| --- | --- | --- |
| `getDashboardStats()` | `GET /api/v1/admin/dashboard` | **OK** (perf concern — §2) |
| `getAuditLogs({ incidentId })` | `GET /api/v1/admin/audit-logs` | **OK** (unbounded — §2) |
| `getUsers()` | — | **GAP** |

### 1.4 Departments / handoffs / notifications

| Frontend | Backend | Fit |
| --- | --- | --- |
| `departmentApi.*` | `/api/v1/departments` CRUD + activate/deactivate | **OK** |
| `handoffApi.getByIncident` | `GET …/incidents/:id/handoffs` | **OK** |
| `handoffApi.getAll` | `GET /api/v1/admin/handoffs` | **ADAPTER** | Path under **admin**, not `/handoffs`. Client must map. |
| `handoffApi.update` / `complete` | `PATCH/POST /api/v1/handoffs/…` | **OK** |
| `notificationApi.getAll` | `GET /api/v1/notifications` | **ADAPTER** | Mock is ops-global; backend scopes by recipient (+ null for ADMIN). |
| `markAsRead` / `markAllAsRead` | `POST …/read`, `…/read-all` | **ADAPTER** | mark-all returns `{ count }` not bare number. |
| `notificationApi.create` | — | **GAP** | Used for mock SMS/EMAIL enqueue from UI paths; lifecycle already creates rows server-side. |

### 1.5 External / media helpers (out of Flask core today)

| Frontend | Backend | Fit |
| --- | --- | --- |
| `geocode-api` / `weather-api` | — | **N/A** (Phase 8 proxies) — still browser → Open-Meteo |
| `mediaApi.upload` → data URL / placeholder | POST media URL only | **ADAPTER** | Large data URLs will bloat DB/JSON. Need Storage + signed upload before production media. |

### 1.6 Actor pattern (systemic)

Almost every mutating mock call takes `actor: Actor = { id, name }`.  
Flask derives actor from JWT (`get_current_user()`).  

**Wiring rule:** strip `actor` arguments in the HTTP layer; never trust client-supplied actor id/name for audits.

---

## 2. Speed / performance weaknesses

### 2.1 Critical (will hurt as data grows)

| Issue | Where | Impact | Mitigation |
| --- | --- | --- | --- |
| **Dashboard loads all incidents into Python** | `admin_service.dashboard_stats` | O(n) memory + CPU per dashboard open | SQL `COUNT(*) FILTER` / `GROUP BY status_code` |
| **Unbounded incident list** | `GET /incidents` | Admin inbox / analytics can transfer MBs | Cursor/limit pagination + default page size |
| **Unbounded audit log** | `GET /admin/audit-logs` | Grows forever | `limit`/`cursor` + default 50–100 |
| **Unbounded notifications** | `GET /notifications` | Same | Pagination + unread-first index already helps |
| **Verification status map** | `GET /verification-statuses` | Loads all incidents; then per-id latest verification helper pattern in related code | Single SQL with `DISTINCT ON` / window; or drop if list already embeds `verificationStatus` |
| **Chatty detail pages** | Review/Detail: 6–8 parallel fetches | Latency = slowest of N round-trips over EU pooler | `GET /incidents/:id/bundle` (incident + history + notes + media + verification + handoffs) |
| **Admin incidents page** | `getAll` + `getAll handoffs` + `getAll departments` | Three full-table pulls | Paginate incidents; cache departments; handoffs only for visible page |

### 2.2 High

| Issue | Notes |
| --- | --- |
| **Supabase pooler RTT** | Session pooler is correct for Flask, but each HTTP request pays network + TLS. Chatty UI amplifies this. |
| **No HTTP caching** | No `ETag` / `Cache-Control` on public `active`/`community` or department lists. |
| **No connection pooling tuning** | `pool_pre_ping=True` only; no explicit `pool_size` for concurrent admin users. |
| **List query window function** | Latest verification via `row_number()` join is fine at small n; ensure indexes used (`idx_verifications_incident_created`). |
| **`mark_as_read` visibility check** | Loads full notification list then scans — O(n) per mark. Use scoped `SELECT` by id + visibility predicate. |
| **Analytics page** | `incidentApi.getAll()` + dashboard stats → double full scan. Prefer stats-only + aggregated series endpoint. |

### 2.3 Medium

| Issue | Notes |
| --- | --- |
| **Serialize in Python** | Manual dict builders are fine; Marshmallow dump adds CPU. Prefer lean serializers on hot paths. |
| **Audit payloads on update** | `REPORT_UPDATED` stores full JSON before/after — large rows, slow audits UI. Store field diffs. |
| **Media as URLs in DB** | Data URLs from current `mediaApi` will explode row size and list payloads. |
| **No CDN / Storage** | Every media fetch hits app or huge JSON — Phase 8 Storage is required for speed. |
| **Gunicorn not configured for prod** | Single Flask process in local `flask run` — not a prod speed issue yet, but wire-up demos should use gunicorn workers when load-testing. |

### 2.4 Frontend-amplified latency (after wiring)

These are not Flask bugs, but will look like “API is slow”:

- Review page: `Promise.all` of ~7 endpoints (see `AdminIncidentReviewPage`).
- Incidents inbox: three full collections.
- No stale-while-revalidate / React Query cache in many places (page-local state + remount refetch).

**Recommendation before or with Phase 7:** add one **incident detail aggregate** endpoint and **pagination** on list/audit/notifications.

---

## 3. Realtime connection assessment

### 3.1 Current state

| Layer | Realtime? |
| --- | --- |
| Frontend | **None** — no WebSocket, SSE, or Supabase Realtime client usage found |
| Flask | **None** — pure request/response REST |
| Supabase | Realtime available on project but **unused** |
| UX expectation | Admin panel feels “live” because mock mutations update the in-memory store synchronously; after Flask, other tabs/users won’t see changes until refetch |

### 3.2 Gaps vs product goals

Architecture rules call for eventual **Supabase Realtime** (notifications, map markers, inbox). Without it:

1. **Multi-admin conflict:** two admins can overwrite / race on same incident without presence or live status.
2. **Citizen map:** `getActive()` is poll-only unless the UI polls (today it mostly loads on mount).
3. **Notification bell:** unread count won’t update until navigation/refetch.
4. **Handoff board:** department status changes invisible to others in realtime.

### 3.3 Options (ordered by fit)

| Option | Pros | Cons |
| --- | --- | --- |
| **A. Supabase Realtime on tables** (`incidents`, `notifications`, `incident_department_handoffs`) | Native to stack; scales; RLS later | Frontend needs Supabase anon client + careful RLS; Flask still writes via service connection |
| **B. SSE from Flask** (`GET /api/v1/stream`) | Single auth model (JWT) | Sticky sessions, worker complexity, not as mature as Supabase Realtime |
| **C. Short polling** (15–30s) on inbox/map/notifications | Fast to ship with Phase 7 | Wasteful; still feels laggy; load on dashboard queries |
| **D. Refetch-on-focus / after mutation only** | Minimal work | No cross-user live updates |

**Recommendation:** Phase 7 ship with **D + optional C** for notifications badge; schedule **A** as Phase 8 alongside Storage. Do not block frontend wiring on Realtime, but document that “live ops” is incomplete without it.

---

## 4. Contract / semantic mismatches (fix before wiring)

Priority **P0** (will break or confuse login/signup/account):

1. Login/register password + token response shape.  
2. Missing `updateUserProfile` / `GET user`.  
3. Sign-up must send password to Flask.  
4. Persist JWT (not only `AuthUser`) in session storage.

Priority **P1** (wrong UX / wrong data):

5. Notes sort order (newest vs oldest).  
6. `handoffApi.getAll` URL mapping (`/admin/handoffs`).  
7. `markAllAsRead` return `{ count }` vs `number`.  
8. `removeMedia` 204 vs boolean.  
9. Notification inbox scoping (citizens won’t see ops-wide null-recipient rows — may be intended).

Priority **P2** (compat / polish):

10. `notificationApi.create` — either stub no-op (server creates on lifecycle) or add admin-only enqueue endpoint.  
11. `adminApi.getUsers` — stub empty or implement.  
12. Register password min length 8 vs UI 6.  
13. Error shape: Flask-Smorest `{ message }` / validation errors vs `throw new Error(string)` in mock — UI toasts must read API errors.

---

## 5. Security / integrity notes (wiring-relevant)

| Topic | Assessment |
| --- | --- |
| Actor spoofing | **Fixed** by JWT — good. Ensure client never sends actor for authorization. |
| Public active/community | Unauthenticated reads — OK for map; ensure no PII in those serializers (reporter phone/email currently **are** on full `IncidentSchema` for public routes). **P0 privacy:** strip reporter contact fields on `/active` and `/community`. |
| JWT secret length | Dev warning if `< 32` bytes — set long `JWT_SECRET_KEY` in `.env`. |
| ADMIN lifecycle | Correctly gated. USER cannot verify/resolve — matches enterprise intent; mock was actor-based. |
| Soft archive / soft media delete | Good; list filters respect archive/deleted. |
| Rate limiting | Missing — login/register abuse possible. |
| CORS | Dev origins only — OK for now. |

---

## 6. What the API does well (keep)

- Versioned `/api/v1` + OpenAPI Bearer auth docs.  
- Lifecycle transitions validated against `incident_status_transitions`.  
- Atomic writes: incident + history + audit + notifications.  
- CamelCase DTOs aligned with `types/incident.ts` / `AuthUser`.  
- Soft archive instead of hard delete.  
- Indexes from ERD for inbox/coords/notifications.  
- Pytest coverage for auth, reads, CRUD, lifecycle, supporting writes.

---

## 7. Recommended sequence before / during Phase 7

### Must-fix (blocker or P0 privacy)

1. Strip PII from public `/active` and `/community` responses.  
2. Align auth adapter: password login/register + store JWT.  
3. Add `PATCH /api/v1/auth/me` (or `/users/me`) for AccountPage.  
4. Fix notes sort to newest-first **or** document and sort in client.

### Should-fix (performance)

5. Rewrite dashboard stats as SQL aggregates.  
6. Add `limit`/`cursor` to incidents, audit logs, notifications.  
7. Add `GET /api/v1/incidents/:id/detail` aggregate for review/detail pages.

### Can defer

8. Supabase Realtime (Phase 8).  
9. Storage uploads (Phase 8).  
10. Geocode/weather proxy (Phase 8).  
11. `getUsers` admin page.  
12. Polling helper on frontend.

---

## 8. Phase 7 wiring checklist (contract-driven)

When implementing the HTTP layer:

- [ ] `VITE_API_BASE` + `VITE_USE_MOCK_API` flag  
- [ ] `Authorization: Bearer` on all non-public routes  
- [ ] Map service methods → `/api/v1/...` (especially handoffs list + media delete)  
- [ ] Normalize errors for toasts  
- [ ] Map 204 delete → boolean if UI expects it  
- [ ] Map `{ count }` mark-all-read  
- [ ] Stop passing `actor` into API calls  
- [ ] Replace magic-link “passwordless” confirm flow or bridge it (temp: require password login only)  
- [ ] Smoke: Brian login → dashboard → verify → start-response → resolve → active map  

---

## 9. Appendix — Endpoint inventory (backend)

```
GET  /api/v1/health
POST /api/v1/auth/register|login
GET  /api/v1/auth/me
GET  /api/v1/incidents[/active|/community|/verification-statuses]
GET|POST /api/v1/incidents
GET|PATCH /api/v1/incidents/:id
POST /api/v1/incidents/:id/{archive,verify,close,start-response,resolve,reopen}
GET|POST /api/v1/incidents/:id/{notes,media,history,verifications,verification,handoffs}
DELETE /api/v1/incidents/media/:mediaId
GET  /api/v1/admin/{dashboard,audit-logs,handoffs}
GET|POST /api/v1/departments
GET|PATCH /api/v1/departments/:id
POST /api/v1/departments/:id/{activate,deactivate}
PATCH /api/v1/handoffs/:id
POST /api/v1/handoffs/:id/complete
GET  /api/v1/notifications
POST /api/v1/notifications/read-all
POST /api/v1/notifications/:id/read
```

**Missing vs frontend contracts:** users list/get/update, notification create, profile update, geocode/weather, storage upload, realtime/SSE.

---

## 10. Progress log (backend fixes)

| Date | Change |
| --- | --- |
| 2026-08-25 | Public `/active` + `/community` strip reporter PII (`public=True` serializer). |
| 2026-08-25 | Notes list newest-first. `PATCH /auth/me`. `GET /admin/users` (+ by id). |
| 2026-08-25 | Dashboard SQL aggregates. Pagination (`items/total/limit/offset/hasMore`) on incidents, audit logs, notifications. |
| 2026-08-25 | `GET /incidents/:id/detail` aggregate. Verification-status map single query. `mark_as_read` scoped SELECT. |
| 2026-08-25 | Auth rate limit (disabled under TESTING). Pool sizing env. Register password min 6. Audit `REPORT_UPDATED` field diffs. `POST /notifications` admin enqueue. |
| 2026-08-25 | Frontend-only gaps recorded in `.cursor/rules/frontend-flask-integration.mdc` for Phase 7. |

*End of audit.*
