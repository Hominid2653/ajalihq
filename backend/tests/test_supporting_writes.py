from decimal import Decimal
from uuid import uuid4

from app.extensions import db
from app.models import (
    Department,
    Incident,
    IncidentDepartmentHandoff,
    Notification,
    User,
)
from app.utils.passwords import hash_password
from tests.test_reads import _auth_header


def _seed_supporting(app):
    with app.app_context():
        citizen = User(
            id=uuid4(),
            name="Support Citizen",
            email="support-citizen@example.com",
            password_hash=hash_password("password123"),
            role_code="USER",
            phone="+254700000030",
            preferred_contact_method="PHONE",
            profile_complete=True,
            id_verified=False,
        )
        admin = User(
            id=uuid4(),
            name="Support Admin",
            email="support-admin@example.com",
            password_hash=hash_password("password123"),
            role_code="ADMIN",
            phone="+254700000031",
            preferred_contact_method="PHONE",
            profile_complete=True,
            id_verified=False,
        )
        dept = Department(
            id=uuid4(),
            name="Support Fire",
            type_code="FIRE",
            active=True,
        )
        incident = Incident(
            id=uuid4(),
            reference="AJL-S001",
            title="Support incident",
            description="Notes and media",
            type_code="fire",
            urgency_code="MEDIUM",
            severity_code="MODERATE",
            status_code="IN_PROGRESS",
            location="Nakuru",
            lat=Decimal("-0.3"),
            lng=Decimal("36.08"),
            reporter_id=citizen.id,
            reporter_name=citizen.name,
            archived=False,
        )
        db.session.add_all([citizen, admin, dept])
        db.session.flush()
        incident.reporter_id = citizen.id
        db.session.add(incident)
        db.session.flush()
        handoff = IncidentDepartmentHandoff(
            id=uuid4(),
            incident_id=incident.id,
            department_id=dept.id,
            initiated_by_id=admin.id,
            initiated_by_name=admin.name,
            status_code="PENDING",
        )
        note_notif = Notification(
            id=uuid4(),
            recipient_id=None,
            incident_id=incident.id,
            type_code="REPORT_RECEIVED",
            channel_code="IN_APP",
            title="Ops ping",
            body="Unread",
            read=False,
        )
        db.session.add_all([handoff, note_notif])
        db.session.commit()
        return {
            "admin_email": admin.email,
            "citizen_email": citizen.email,
            "incident_id": str(incident.id),
            "handoff_id": str(handoff.id),
            "notification_id": str(note_notif.id),
            "department_id": str(dept.id),
        }


def test_notes_media_handoff_department_notifications(client, app):
    ids = _seed_supporting(app)
    admin = _auth_header(client, ids["admin_email"])
    citizen = _auth_header(client, ids["citizen_email"])

    note = client.post(
        f"/api/v1/incidents/{ids['incident_id']}/notes",
        headers=citizen,
        json={"body": "Citizen follow-up note"},
    )
    assert note.status_code == 201, note.get_json()
    assert note.get_json()["body"] == "Citizen follow-up note"

    note2 = client.post(
        f"/api/v1/incidents/{ids['incident_id']}/notes",
        headers=admin,
        json={"body": "Admin newest note"},
    )
    assert note2.status_code == 201
    notes_list = client.get(
        f"/api/v1/incidents/{ids['incident_id']}/notes",
        headers=admin,
    )
    assert notes_list.status_code == 200
    bodies = [n["body"] for n in notes_list.get_json()]
    assert bodies[0] == "Admin newest note"

    media = client.post(
        f"/api/v1/incidents/{ids['incident_id']}/media",
        headers=admin,
        json={
            "kind": "image",
            "url": "https://placehold.co/200x200/png",
            "name": "extra.png",
        },
    )
    assert media.status_code == 201, media.get_json()
    media_id = media.get_json()["id"]

    deleted = client.delete(
        f"/api/v1/incidents/media/{media_id}",
        headers=admin,
    )
    assert deleted.status_code == 204

    listed_media = client.get(
        f"/api/v1/incidents/{ids['incident_id']}/media",
        headers=admin,
    )
    assert all(item["id"] != media_id for item in listed_media.get_json())

    handoff = client.patch(
        f"/api/v1/handoffs/{ids['handoff_id']}",
        headers=admin,
        json={"status": "ACKNOWLEDGED", "notes": "Unit en route"},
    )
    assert handoff.status_code == 200, handoff.get_json()
    assert handoff.get_json()["status"] == "ACKNOWLEDGED"

    completed = client.post(
        f"/api/v1/handoffs/{ids['handoff_id']}/complete",
        headers=admin,
        json={"notes": "Done"},
    )
    assert completed.status_code == 200
    assert completed.get_json()["status"] == "COMPLETED"

    created_dept = client.post(
        "/api/v1/departments",
        headers=admin,
        json={"name": "New Ambulance Unit", "type": "AMBULANCE"},
    )
    assert created_dept.status_code == 201, created_dept.get_json()
    dept_id = created_dept.get_json()["id"]

    deactivated = client.post(
        f"/api/v1/departments/{dept_id}/deactivate",
        headers=admin,
    )
    assert deactivated.status_code == 200
    assert deactivated.get_json()["active"] is False

    denied_dept = client.post(
        "/api/v1/departments",
        headers=citizen,
        json={"name": "Nope", "type": "OTHER"},
    )
    assert denied_dept.status_code == 403

    marked = client.post(
        f"/api/v1/notifications/{ids['notification_id']}/read",
        headers=admin,
    )
    assert marked.status_code == 200
    assert marked.get_json()["read"] is True

    inbox = client.get("/api/v1/notifications", headers=admin)
    assert inbox.status_code == 200
    assert "items" in inbox.get_json()

    # seed another unread then mark all
    with app.app_context():
        from uuid import uuid4 as new_uuid

        db.session.add(
            Notification(
                id=new_uuid(),
                recipient_id=None,
                type_code="CRITICAL_INCIDENT",
                channel_code="IN_APP",
                title="Another",
                body="Unread 2",
                read=False,
            )
        )
        db.session.commit()

    all_read = client.post("/api/v1/notifications/read-all", headers=admin)
    assert all_read.status_code == 200
    assert all_read.get_json()["count"] >= 1

    created_notif = client.post(
        "/api/v1/notifications",
        headers=admin,
        json={
            "type": "CITIZEN_STATUS_NOTIFY",
            "channel": "EMAIL",
            "title": "Ops email",
            "body": "Test Resend dispatch",
            "toEmail": "ops-test@example.com",
            "incidentId": ids["incident_id"],
        },
    )
    assert created_notif.status_code == 201, created_notif.get_json()
    body = created_notif.get_json()
    assert body["channel"] == "EMAIL"
    # TESTING has no RESEND_API_KEY → dry_run
    assert body.get("deliveryStatus") == "dry_run"
