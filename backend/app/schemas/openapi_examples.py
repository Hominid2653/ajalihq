"""Swagger / OpenAPI Try-it-out API."""

from __future__ import annotations

# ── Auth ──────────────────────────────────────────────────────────────────────

LOGIN_ADMIN = {
    "email": "brian@ajalihq.test",
    "password": "password",
}

LOGIN_CITIZEN = {
    "email": "amina@ajalihq.test",
    "password": "password",
}

REGISTER_CITIZEN = {
    "name": "Test Citizen",
    "email": "new-citizen@example.com",
    "password": "password123",
    "phone": "+254700000001",
    "location": "Nairobi",
    "idNumber": "12345678",
    "preferredContactMethod": "PHONE",
}

UPDATE_PROFILE = {
    "location": "Nairobi, Kenya",
    "bio": "Community reporter",
    "preferredContactMethod": "PHONE",
}

# ── Incidents ─────────────────────────────────────────────────────────────────

CREATE_INCIDENT = {
    "title": "Multi-vehicle collision on Uhuru Highway",
    "description": "Three vehicles involved near Bunyala Road junction. Injuries reported.",
    "type": "accident",
    "urgency": "HIGH",
    "severity": "MAJOR",
    "location": "Uhuru Highway, Nairobi",
    "lat": -1.2921,
    "lng": 36.8219,
    "reporterName": "Walk-in caller",
    "reporterPhone": "+254711000000",
    "preferredContactMethod": "PHONE",
    "media": [
        {
            "kind": "image",
            "url": "https://placehold.co/600x400/png",
            "name": "scene.png",
        }
    ],
}

UPDATE_INCIDENT = {
    "title": "Updated: collision cleared one lane",
    "urgency": "MEDIUM",
    "description": "One lane reopened; ambulance still on scene.",
}

ARCHIVE_INCIDENT = {
    "reason": "Duplicate of AJL-0001 — merged into primary report.",
}

VERIFY_INCIDENT = {
    "method": "PHONE",
    "notes": "Caller confirmed location and casualties.",
}

CLOSE_INCIDENT = {
    "reason": "Unable to verify — no response from reporter after two attempts.",
    "reasonCode": "UNABLE_TO_VERIFY",
    "failVerification": True,
}

START_RESPONSE = {
    "departmentIds": ["00000000-0000-0000-0000-000000000001"],
    "notes": "Dispatch nearest unit. Replace departmentIds with a real id from GET /api/v1/departments.",
}

RESOLVE_INCIDENT = {
    "summary": "Casualties treated on site; road cleared.",
    "notes": "Ambulance completed handover at KNH.",
    "outcome": "ASSISTANCE_PROVIDED",
    "completeHandoffs": True,
    "notifyCitizen": {"sms": False, "email": True},
}

REOPEN_INCIDENT = {
    "reason": "New information received — response needed again.",
}

ADD_NOTE = {
    "body": "Spoke with traffic police — ETA 10 minutes.",
}

ADD_MEDIA = {
    "kind": "image",
    "url": "https://placehold.co/800x600/png",
    "name": "follow-up.png",
}

# ── Departments / handoffs ────────────────────────────────────────────────────

CREATE_DEPARTMENT = {
    "name": "Nairobi Central Ambulance",
    "type": "AMBULANCE",
    "description": "24/7 EMS unit covering CBD and Westlands.",
    "phone": "+254720000000",
    "email": "dispatch@ambulance.example.ke",
    "location": "Nairobi",
    "active": True,
}

UPDATE_DEPARTMENT = {
    "phone": "+254720000001",
    "description": "Updated contact for night shift.",
}

UPDATE_HANDOFF = {
    "status": "ACKNOWLEDGED",
    "notes": "Unit en route.",
}

COMPLETE_HANDOFF = {
    "notes": "Patient handed over to facility.",
}

# ── Notifications ─────────────────────────────────────────────────────────────

CREATE_NOTIFICATION_EMAIL = {
    "type": "CITIZEN_STATUS_NOTIFY",
    "channel": "EMAIL",
    "title": "Ajali! test",
    "body": "Hello from Ajali backend — replace toEmail with your Resend account email.",
    "toEmail": "you@example.com",
    "incidentId": None,
    "recipientId": None,
}

CREATE_NOTIFICATION_IN_APP = {
    "type": "CRITICAL_INCIDENT",
    "channel": "IN_APP",
    "title": "Ops alert",
    "body": "Manual in-app notice for the admin inbox.",
    "incidentId": None,
    "recipientId": None,
}

# ── Shared path / query hints (for @blp.doc descriptions) ────────────────────

HINT_AUTH = (
    "**Testing:** `POST /api/v1/auth/login` with demo admin "
    "`brian@ajalihq.test` / `password`, copy `accessToken`, click **Authorize**, "
    "paste the token (Swagger adds Bearer)."
)

HINT_ADMIN_ONLY = (
    "**Requires ADMIN JWT.** Login as `brian@ajalihq.test` / `password`, then Authorize."
)

HINT_UUID_PATH = (
    "Path id must be a real UUID from a prior list/create response "
    "(do not use the placeholder `string`)."
)

HINT_LIFECYCLE = (
    "Lifecycle only — does **not** use PATCH. "
    "Flow: PENDING → verify → start-response → resolve "
    "(or PENDING → close). Invalid transitions return **409**."
)

HINT_PAGINATION = (
    "Returns `{ items, total, limit, offset, hasMore }`. "
    "Default `limit=50` (max 200)."
)
