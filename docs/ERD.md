# Ajali! Entity-Relationship Model

This document mirrors the TypeScript domain model in `frontend/src/types/incident.ts` and the Sprint 1 mock store in `frontend/src/data/api.ts`.

Import `docs/erd.dbml` into [dbdiagram.io](https://dbdiagram.io) for a visual ERD.

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
 CLOSED    VERIFIED  (ReporterVerification record)
              ↓
        START RESPONSE (select Department(s))
              ↓
          IN_PROGRESS + DepartmentHandoff(s)
              ↓
           RESOLVED (resolution summary/outcome)
```

## Entities

### users
Citizen reporters and admins. `role` is `USER` | `ADMIN`. Incidents reference `reporter_id` (`userId` in the frontend model).

### incidents
Core emergency report. Holds **urgency** (admin attention speed) and **severity** (incident seriousness) as separate fields.

- Status lifecycle: `PENDING → VERIFIED → IN_PROGRESS → RESOLVED` (or `CLOSED` from pending/verified).
- Does **not** embed department names; departments are linked through handoffs.
- Optional denormalized reporter contact fields support phone/walk-in reports without forcing a full user account.

### reporter_verifications
Structured verification outcomes (`PENDING` | `VERIFIED` | `FAILED`) with method (`PHONE` | `EMAIL` | `OTHER`), actor, timestamp, and notes. Incident may point at the latest verification via `verification_id`.

### departments
First-class response organizations (Police, Fire, Ambulance, etc.) with contact details and active flag.

### incident_department_handoffs
Many-to-many operational assignment between an incident and departments. Tracks handoff lifecycle (`PENDING` → `ACKNOWLEDGED` → `IN_PROGRESS` → `COMPLETED`).

### incident_media
Shared evidence (images/videos) for citizen and admin uploads. Sprint 1 mocks storage URLs.

### incident_notes
Operational notes authored by admins (and later responders).

### incident_status_history
Append-only status transitions with actor and reason.

### notifications
Event records for `IN_APP` / `EMAIL` / `SMS`. Sprint 1 mocks SMS/EMAIL channels; Sprint 2 plugs providers without UI rewrites.

### audit_logs
Immutable operational audit trail (`REPORT_CREATED`, `REPORT_VERIFIED`, `RESPONSE_STARTED`, `DEPARTMENT_ASSIGNED`, `INCIDENT_RESOLVED`, etc.).

## Relationships (normalized)

| From | To | Cardinality | Notes |
|------|----|-------------|-------|
| incidents.reporter_id | users | N:1 | Reporter |
| incidents.resolved_by_id | users | N:1 | Resolver |
| reporter_verifications.incident_id | incidents | N:1 | History of attempts |
| incidents.verification_id | reporter_verifications | N:1 | Latest verification |
| incident_department_handoffs.incident_id | incidents | N:1 | |
| incident_department_handoffs.department_id | departments | N:1 | |
| incident_media / notes / status_history / notifications / audit_logs | incidents | N:1 | Supporting records |

## Frontend ↔ Flask migration

```
UI / Redux / hooks
        ↓
service facades (incidentApi, departmentApi, handoffApi, mediaApi, …)
        ↓
Sprint 1: data/api.ts (mock)
Sprint 2: Flask REST → PostgreSQL
```

Keep service method names and TypeScript contracts stable so Admin pages do not need a rewrite when the mock is replaced.
