"""Seed departments + sample incidents for every status (idempotent)."""

from __future__ import annotations

import sys
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import select

from app import create_app
from app.extensions import db
from app.models import (
    AuditLog,
    Department,
    Incident,
    IncidentDepartmentHandoff,
    IncidentMedia,
    IncidentNote,
    IncidentStatusHistory,
    Notification,
    ReporterVerification,
    User,
)
from scripts.seed_demo_users import DEMO_USERS, seed_demo_users

AMINA_ID = DEMO_USERS[0]["id"]
BRIAN_ID = DEMO_USERS[1]["id"]

DEPT_POLICE = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1")
DEPT_FIRE = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2")

INCIDENT_SPECS = [
    {
        "id": uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1"),
        "reference": "AJL-0001",
        "title": "Multi-vehicle collision on Uhuru Highway",
        "description": "Three vehicles involved near Nyayo House. Traffic blocked southbound.",
        "type_code": "accident",
        "urgency_code": "HIGH",
        "severity_code": "MAJOR",
        "status_code": "PENDING",
        "location": "Uhuru Highway, Nairobi",
        "lat": Decimal("-1.286389"),
        "lng": Decimal("36.817223"),
    },
    {
        "id": uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2"),
        "reference": "AJL-0002",
        "title": "Kitchen fire in apartment block",
        "description": "Smoke reported from 3rd floor flat in Westlands.",
        "type_code": "fire",
        "urgency_code": "CRITICAL",
        "severity_code": "CRITICAL",
        "status_code": "VERIFIED",
        "location": "Westlands, Nairobi",
        "lat": Decimal("-1.267000"),
        "lng": Decimal("36.810000"),
    },
    {
        "id": uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3"),
        "reference": "AJL-0003",
        "title": "Pedestrian medical emergency",
        "description": "Unconscious pedestrian at Nakuru CBD bus stage.",
        "type_code": "medical",
        "urgency_code": "HIGH",
        "severity_code": "MODERATE",
        "status_code": "IN_PROGRESS",
        "location": "Nakuru CBD",
        "lat": Decimal("-0.303099"),
        "lng": Decimal("36.080025"),
    },
    {
        "id": uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4"),
        "reference": "AJL-0004",
        "title": "Resolved roadside spill",
        "description": "Fuel spill cleaned after tanker leak on A104.",
        "type_code": "disaster",
        "urgency_code": "MEDIUM",
        "severity_code": "MODERATE",
        "status_code": "RESOLVED",
        "location": "Eldoret–Nakuru Highway",
        "lat": Decimal("0.514277"),
        "lng": Decimal("35.269780"),
    },
    {
        "id": uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5"),
        "reference": "AJL-0005",
        "title": "Closed duplicate report",
        "description": "Duplicate of AJL-0001; closed after review.",
        "type_code": "accident",
        "urgency_code": "LOW",
        "severity_code": "MINOR",
        "status_code": "CLOSED",
        "location": "Uhuru Highway, Nairobi",
        "lat": Decimal("-1.286500"),
        "lng": Decimal("36.817300"),
        "close_reason_code": "DUPLICATE",
    },
]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def seed_demo_data() -> None:
    seed_demo_users()
    now = _utcnow()
    amina = db.session.get(User, AMINA_ID)
    brian = db.session.get(User, BRIAN_ID)
    assert amina and brian

    for dept in (
        Department(
            id=DEPT_POLICE,
            name="Kenya Police Service",
            type_code="POLICE",
            description="National police response and scene security.",
            phone="+254200000001",
            email="ops@police.example.ke",
            location="Nairobi",
            active=True,
        ),
        Department(
            id=DEPT_FIRE,
            name="Nairobi Fire Brigade",
            type_code="FIRE",
            description="Fire and rescue response for Nairobi County.",
            phone="+254200000002",
            email="dispatch@fire.example.ke",
            location="Nairobi",
            active=True,
        ),
    ):
        if db.session.get(Department, dept.id) is None:
            db.session.add(dept)

    for i, spec in enumerate(INCIDENT_SPECS):
        existing = db.session.get(Incident, spec["id"])
        if existing is not None:
            continue

        created = now - timedelta(hours=6 - i)
        incident = Incident(
            id=spec["id"],
            reference=spec["reference"],
            title=spec["title"],
            description=spec["description"],
            type_code=spec["type_code"],
            urgency_code=spec["urgency_code"],
            severity_code=spec["severity_code"],
            status_code=spec["status_code"],
            location=spec["location"],
            lat=spec["lat"],
            lng=spec["lng"],
            reporter_id=AMINA_ID,
            reporter_name=amina.name,
            reporter_email=amina.email,
            reporter_phone=amina.phone,
            preferred_contact_method="PHONE",
            close_reason_code=spec.get("close_reason_code"),
            archived=False,
            created_at=created,
            updated_at=created,
        )
        if spec["status_code"] == "RESOLVED":
            incident.resolution_summary = "Scene cleared; traffic restored."
            incident.resolution_outcome_code = "RESOLVED"
            incident.resolved_by_id = BRIAN_ID
            incident.resolved_by_name = brian.name
            incident.resolved_at = created + timedelta(hours=2)

        db.session.add(incident)
        db.session.flush()

        db.session.add(
            IncidentStatusHistory(
                incident_id=incident.id,
                from_status_code=None,
                to_status_code="PENDING",
                actor_id=AMINA_ID,
                actor_name=amina.name,
                reason="Report received",
                created_at=created,
            )
        )
        db.session.add(
            AuditLog(
                incident_id=incident.id,
                incident_reference=incident.reference,
                entity_type="incident",
                entity_id=incident.id,
                actor_id=AMINA_ID,
                actor_name=amina.name,
                action_code="REPORT_CREATED",
                new_value=incident.status_code,
                created_at=created,
            )
        )
        db.session.add(
            Notification(
                recipient_id=None,
                incident_id=incident.id,
                type_code="REPORT_RECEIVED",
                channel_code="IN_APP",
                title=f"New report {incident.reference}",
                body=incident.title,
                read=False,
                created_at=created,
            )
        )
        db.session.add(
            IncidentNote(
                incident_id=incident.id,
                author_id=BRIAN_ID,
                author_name=brian.name,
                body="Seed note for ops review.",
                created_at=created + timedelta(minutes=5),
            )
        )
        db.session.add(
            IncidentMedia(
                incident_id=incident.id,
                kind_code="image",
                url="https://placehold.co/600x400/png",
                name="scene.png",
                uploaded_by_id=AMINA_ID,
                created_at=created + timedelta(minutes=2),
            )
        )

        if spec["status_code"] in ("VERIFIED", "IN_PROGRESS", "RESOLVED"):
            db.session.add(
                ReporterVerification(
                    incident_id=incident.id,
                    status_code="VERIFIED",
                    method_code="PHONE",
                    notes="Caller confirmed details",
                    verified_by_id=BRIAN_ID,
                    verified_by_name=brian.name,
                    verified_at=created + timedelta(minutes=30),
                    created_at=created + timedelta(minutes=30),
                    updated_at=created + timedelta(minutes=30),
                )
            )
            db.session.add(
                IncidentStatusHistory(
                    incident_id=incident.id,
                    from_status_code="PENDING",
                    to_status_code="VERIFIED",
                    actor_id=BRIAN_ID,
                    actor_name=brian.name,
                    reason="Verified with reporter",
                    created_at=created + timedelta(minutes=30),
                )
            )

        if spec["status_code"] in ("IN_PROGRESS", "RESOLVED"):
            db.session.add(
                IncidentDepartmentHandoff(
                    incident_id=incident.id,
                    department_id=DEPT_POLICE if spec["type_code"] != "fire" else DEPT_FIRE,
                    initiated_by_id=BRIAN_ID,
                    initiated_by_name=brian.name,
                    status_code="IN_PROGRESS" if spec["status_code"] == "IN_PROGRESS" else "COMPLETED",
                    notes="Seed handoff",
                    handed_off_at=created + timedelta(hours=1),
                    acknowledged_at=created + timedelta(hours=1, minutes=10),
                    completed_at=(
                        created + timedelta(hours=2)
                        if spec["status_code"] == "RESOLVED"
                        else None
                    ),
                    updated_at=created + timedelta(hours=1, minutes=10),
                )
            )
            db.session.add(
                IncidentStatusHistory(
                    incident_id=incident.id,
                    from_status_code="VERIFIED",
                    to_status_code="IN_PROGRESS",
                    actor_id=BRIAN_ID,
                    actor_name=brian.name,
                    reason="Response started",
                    created_at=created + timedelta(hours=1),
                )
            )

        if spec["status_code"] == "RESOLVED":
            db.session.add(
                IncidentStatusHistory(
                    incident_id=incident.id,
                    from_status_code="IN_PROGRESS",
                    to_status_code="RESOLVED",
                    actor_id=BRIAN_ID,
                    actor_name=brian.name,
                    reason="Resolved on scene",
                    created_at=created + timedelta(hours=2),
                )
            )

        if spec["status_code"] == "CLOSED":
            db.session.add(
                IncidentStatusHistory(
                    incident_id=incident.id,
                    from_status_code="PENDING",
                    to_status_code="CLOSED",
                    actor_id=BRIAN_ID,
                    actor_name=brian.name,
                    reason="Duplicate report",
                    created_at=created + timedelta(minutes=20),
                )
            )

    db.session.commit()


def main() -> None:
    app = create_app()
    with app.app_context():
        seed_demo_data()
        print("Demo data seeded (users, departments, incidents).")


if __name__ == "__main__":
    main()
