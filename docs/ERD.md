# Ajali! Entity-Relationship Model

Canonical diagram code: [`docs/erd.dbml`](erd.dbml). Paste it into [dbdiagram.io](https://dbdiagram.io).

This schema is the Sprint 2 PostgreSQL target. It matches `frontend/src/types/incident.ts`, `frontend/src/types/auth.ts`, and the mock store in `frontend/src/data/api.ts`.

## Design rules

- **Atomicity:** A lifecycle change updates `incidents` and inserts `incident_status_history`, `audit_logs`, and `notifications` in **one database transaction**. Do not persist those side effects in the UI.
- **Loose coupling:** Incidents do not embed departments. Assignments live in `incident_department_handoffs`. Latest verification is the newest `reporter_verifications` row (no circular `verification_id` FK). Name columns on child rows are **write-time snapshots**, not live joins.
- **Flexibility:** Domain values are **lookup tables**, not PostgreSQL ENUMs. Adding a type, channel, or audit action is an INSERT. `metadata jsonb` holds extras without a migration. `incident_status_transitions` is the allowed-lifecycle table (`canTransition` in the frontend).
- **Integrity:** UUID primary keys. Foreign keys use `ON DELETE RESTRICT`. Archive incidents instead of deleting them. History, audit, and notifications are append-only.

## Operational workflow

```
REPORT RECEIVED (PENDING)
        ↓
URGENCY + SEVERITY assessed
        ↓
ADMIN REVIEW + REPORTER CONTACT
        ↓
VALID?
   ┌────┴────┐
   NO        YES
   ↓          ↓
 CLOSED    VERIFIED  (reporter_verifications row)
              ↓
        START RESPONSE (handoff rows)
              ↓
          IN_PROGRESS
              ↓
           RESOLVED
```

## Frontend field map

| Frontend | Database |
| --- | --- |
| `AuthUser.id` / `Incident.userId` | `users.id` / `incidents.reporter_id` |
| `AuthUser.verified` | `users.id_verified` |
| `AuthUser.idNumber` | `users.id_number` |
| `Incident.type` / `status` / `urgency` / `severity` | `*_code` FK to lookup tables |
| `Incident.verificationId` | derived: latest `reporter_verifications.id` for that incident |
| `IncidentListItem.verificationStatus` | join / subquery on latest verification |
| `AuditLog.incidentReference` | `audit_logs.incident_reference` snapshot |
| `AppNotification` (ops-wide in Sprint 1) | `notifications.recipient_id` nullable |

## Tables

**users** — Citizens and admins. Role, contact, avatar, bio, national ID verification, password hash for Flask.

**incidents** — One report. Current status/urgency/severity as codes. Reporter snapshots for walk-in/phone. Archive flag instead of delete.

**reporter_verifications** — One row per verification attempt. Query latest by `created_at`.

**departments** — Police, fire, hospital, ambulance, disaster response, other.

**incident_department_handoffs** — Unique `(incident_id, department_id)`. Status walks PENDING → ACKNOWLEDGED → IN_PROGRESS → COMPLETED (or CANCELLED).

**incident_media** — Images/videos. `storage_key` is for object storage later; `deleted_at` is soft delete.

**incident_notes** — Operational notes; `updated_at` if a note is edited.

**incident_status_history** — Append-only transitions with actor and reason.

**notifications** — IN_APP / EMAIL / SMS events. Optional recipient for per-user inboxes.

**audit_logs** — Append-only. `entity_type` + `entity_id` cover department actions that have no incident.

**Lookups** — Seed from the TypeScript unions. Mark `active = false` to retire a code without rewriting history.

## Indexes

Every FK is indexed. Inbox/map filters use `(archived, status_code, created_at)`, `(urgency_code, created_at)`, and `(lat, lng)`. Notification unread uses `(recipient_id, read, created_at)`. Unique: `users.email`, `users.id_number`, `incidents.reference`, handoff `(incident_id, department_id)`.

## Flask migration

```
UI / Redux / hooks
        ↓
service facades (incidentApi, departmentApi, …)
        ↓
Sprint 1: data/api.ts
Sprint 2: Flask REST → this schema
```

Keep service method names and TypeScript contracts stable. SQLAlchemy models must follow `docs/erd.dbml`.
