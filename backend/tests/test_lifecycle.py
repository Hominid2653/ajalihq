from decimal import Decimal
from uuid import uuid4

from app.extensions import db
from app.models import Department, Incident, User
from app.utils.passwords import hash_password
from tests.test_reads import _auth_header


def _seed_lifecycle(app):
    with app.app_context():
        citizen = User(
            id=uuid4(),
            name="Lifecycle Citizen",
            email="life-citizen@example.com",
            password_hash=hash_password("password123"),
            role_code="USER",
            phone="+254700000020",
            preferred_contact_method="PHONE",
            profile_complete=True,
            id_verified=False,
        )
        admin = User(
            id=uuid4(),
            name="Lifecycle Admin",
            email="life-admin@example.com",
            password_hash=hash_password("password123"),
            role_code="ADMIN",
            phone="+254700000021",
            preferred_contact_method="PHONE",
            profile_complete=True,
            id_verified=False,
        )
        dept = Department(
            id=uuid4(),
            name="Test Police",
            type_code="POLICE",
            active=True,
        )
        db.session.add_all([citizen, admin, dept])
        db.session.flush()

        pending = Incident(
            id=uuid4(),
            reference="AJL-L001",
            title="Lifecycle pending",
            description="For verify → start → resolve",
            type_code="accident",
            urgency_code="HIGH",
            severity_code="MAJOR",
            status_code="PENDING",
            location="Nairobi",
            lat=Decimal("-1.28"),
            lng=Decimal("36.81"),
            reporter_id=citizen.id,
            reporter_name=citizen.name,
            reporter_email=citizen.email,
            reporter_phone=citizen.phone,
            archived=False,
        )
        to_close = Incident(
            id=uuid4(),
            reference="AJL-L002",
            title="Lifecycle close",
            description="For close path",
            type_code="crime",
            urgency_code="LOW",
            severity_code="MINOR",
            status_code="PENDING",
            location="Kisumu",
            reporter_id=citizen.id,
            reporter_name=citizen.name,
            archived=False,
        )
        db.session.add_all([pending, to_close])
        db.session.commit()
        return {
            "admin_email": admin.email,
            "citizen_email": citizen.email,
            "pending_id": str(pending.id),
            "close_id": str(to_close.id),
            "department_id": str(dept.id),
        }


def test_full_lifecycle_happy_path(client, app):
    ids = _seed_lifecycle(app)
    admin = _auth_header(client, ids["admin_email"])
    citizen = _auth_header(client, ids["citizen_email"])
    incident_id = ids["pending_id"]

    denied = client.post(
        f"/api/v1/incidents/{incident_id}/verify",
        headers=citizen,
        json={"method": "PHONE"},
    )
    assert denied.status_code == 403

    verified = client.post(
        f"/api/v1/incidents/{incident_id}/verify",
        headers=admin,
        json={"method": "PHONE", "notes": "Caller confirmed"},
    )
    assert verified.status_code == 200, verified.get_json()
    assert verified.get_json()["status"] == "VERIFIED"

    bad = client.post(
        f"/api/v1/incidents/{incident_id}/resolve",
        headers=admin,
        json={"summary": "too early", "outcome": "RESOLVED"},
    )
    assert bad.status_code == 409

    started = client.post(
        f"/api/v1/incidents/{incident_id}/start-response",
        headers=admin,
        json={"departmentIds": [ids["department_id"]], "notes": "Dispatch"},
    )
    assert started.status_code == 200, started.get_json()
    assert started.get_json()["status"] == "IN_PROGRESS"

    active = client.get("/api/v1/incidents/active")
    assert any(item["id"] == incident_id for item in active.get_json())

    resolved = client.post(
        f"/api/v1/incidents/{incident_id}/resolve",
        headers=admin,
        json={
            "summary": "Scene cleared",
            "outcome": "RESOLVED",
            "notifyCitizen": {"sms": True, "email": True},
        },
    )
    assert resolved.status_code == 200, resolved.get_json()
    assert resolved.get_json()["status"] == "RESOLVED"
    assert resolved.get_json()["resolutionSummary"] == "Scene cleared"

    active_after = client.get("/api/v1/incidents/active")
    assert all(item["id"] != incident_id for item in active_after.get_json())

    reopened = client.post(
        f"/api/v1/incidents/{incident_id}/reopen",
        headers=admin,
        json={"reason": "Follow-up needed"},
    )
    assert reopened.status_code == 200
    assert reopened.get_json()["status"] == "IN_PROGRESS"


def test_close_and_reopen_to_pending(client, app):
    ids = _seed_lifecycle(app)
    admin = _auth_header(client, ids["admin_email"])
    incident_id = ids["close_id"]

    closed = client.post(
        f"/api/v1/incidents/{incident_id}/close",
        headers=admin,
        json={"reason": "Duplicate report", "reasonCode": "DUPLICATE"},
    )
    assert closed.status_code == 200, closed.get_json()
    assert closed.get_json()["status"] == "CLOSED"
    assert closed.get_json()["closeReasonCode"] == "DUPLICATE"

    reopened = client.post(
        f"/api/v1/incidents/{incident_id}/reopen",
        headers=admin,
        json={"reason": "Not a duplicate after all"},
    )
    assert reopened.status_code == 200
    assert reopened.get_json()["status"] == "PENDING"
