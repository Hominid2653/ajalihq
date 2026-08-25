from decimal import Decimal
from uuid import uuid4

from app.extensions import db
from app.models import Incident, User
from app.utils.passwords import hash_password


def _auth_header(client, email: str, password: str = "password123") -> dict[str, str]:
    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200, login.get_json()
    return {"Authorization": f"Bearer {login.get_json()['accessToken']}"}


def _seed_users_and_incident(app):
    with app.app_context():
        citizen = User(
            id=uuid4(),
            name="Citizen",
            email="reader@example.com",
            password_hash=hash_password("password123"),
            role_code="USER",
            phone="+254700000010",
            preferred_contact_method="PHONE",
            profile_complete=True,
            id_verified=False,
        )
        admin = User(
            id=uuid4(),
            name="Admin",
            email="reader-admin@example.com",
            password_hash=hash_password("password123"),
            role_code="ADMIN",
            phone="+254700000011",
            preferred_contact_method="PHONE",
            profile_complete=True,
            id_verified=False,
        )
        db.session.add_all([citizen, admin])
        db.session.flush()

        pending = Incident(
            id=uuid4(),
            reference="AJL-9001",
            title="Pending crash",
            description="Test pending incident",
            type_code="accident",
            urgency_code="HIGH",
            severity_code="MAJOR",
            status_code="PENDING",
            location="Nairobi",
            lat=Decimal("-1.29"),
            lng=Decimal("36.82"),
            reporter_id=citizen.id,
            reporter_name=citizen.name,
            reporter_email=citizen.email,
            archived=False,
        )
        active = Incident(
            id=uuid4(),
            reference="AJL-9002",
            title="Active response",
            description="Test in-progress incident",
            type_code="fire",
            urgency_code="CRITICAL",
            severity_code="CRITICAL",
            status_code="IN_PROGRESS",
            location="Mombasa",
            lat=Decimal("-4.04"),
            lng=Decimal("39.67"),
            reporter_id=citizen.id,
            reporter_name=citizen.name,
            archived=False,
        )
        db.session.add_all([pending, active])
        db.session.commit()
        return {
            "citizen_email": citizen.email,
            "admin_email": admin.email,
            "pending_id": str(pending.id),
            "active_id": str(active.id),
        }


def test_public_active_and_community(client, app):
    ids = _seed_users_and_incident(app)

    active = client.get("/api/v1/incidents/active")
    assert active.status_code == 200
    refs = {item["reference"] for item in active.get_json()}
    assert "AJL-9002" in refs
    assert "AJL-9001" not in refs

    community = client.get("/api/v1/incidents/community")
    assert community.status_code == 200
    refs = {item["reference"] for item in community.get_json()}
    assert "AJL-9002" in refs


def test_list_and_get_rbac(client, app):
    ids = _seed_users_and_incident(app)
    citizen_headers = _auth_header(client, ids["citizen_email"])
    admin_headers = _auth_header(client, ids["admin_email"])

    citizen_list = client.get("/api/v1/incidents", headers=citizen_headers)
    assert citizen_list.status_code == 200
    assert len(citizen_list.get_json()) == 2
    assert "verificationStatus" in citizen_list.get_json()[0]

    detail = client.get(
        f"/api/v1/incidents/{ids['pending_id']}",
        headers=citizen_headers,
    )
    assert detail.status_code == 200
    assert detail.get_json()["reference"] == "AJL-9001"
    assert detail.get_json()["userId"] == detail.get_json()["userId"]

    admin_dash = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert admin_dash.status_code == 200
    stats = admin_dash.get_json()
    assert stats["total"] >= 2
    assert stats["pending"] >= 1
    assert stats["inProgress"] >= 1

    denied = client.get("/api/v1/admin/dashboard", headers=citizen_headers)
    assert denied.status_code == 403

    audit = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert audit.status_code == 200
