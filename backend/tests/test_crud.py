from uuid import UUID

from sqlalchemy import select

from app.extensions import db
from app.models import AuditLog, IncidentStatusHistory, Notification
from tests.test_reads import _auth_header, _seed_users_and_incident


def test_create_update_archive_incident(client, app):
    ids = _seed_users_and_incident(app)
    citizen = _auth_header(client, ids["citizen_email"])
    admin = _auth_header(client, ids["admin_email"])

    created = client.post(
        "/api/v1/incidents",
        headers=citizen,
        json={
            "title": "New roadside collision",
            "description": "Two cars near CBD roundabout",
            "type": "accident",
            "urgency": "HIGH",
            "severity": "MAJOR",
            "location": "Nairobi CBD",
            "lat": -1.286,
            "lng": 36.817,
            "media": [
                {
                    "kind": "image",
                    "url": "https://placehold.co/400x300/png",
                    "name": "scene.png",
                }
            ],
        },
    )
    assert created.status_code == 201, created.get_json()
    body = created.get_json()
    assert body["status"] == "PENDING"
    assert body["reference"].startswith("AJL-")
    assert body["archived"] is False
    incident_id = body["id"]

    with app.app_context():
        uid = UUID(incident_id)
        history = db.session.scalars(
            select(IncidentStatusHistory).where(
                IncidentStatusHistory.incident_id == uid
            )
        ).all()
        assert any(h.to_status_code == "PENDING" for h in history)
        audits = db.session.scalars(
            select(AuditLog).where(AuditLog.incident_id == uid)
        ).all()
        actions = {a.action_code for a in audits}
        assert "REPORT_CREATED" in actions
        assert "MEDIA_ADDED" in actions
        notes = db.session.scalars(
            select(Notification).where(Notification.incident_id == uid)
        ).all()
        assert any(n.type_code == "REPORT_RECEIVED" for n in notes)

    updated = client.patch(
        f"/api/v1/incidents/{incident_id}",
        headers=citizen,
        json={"title": "Updated collision title", "urgency": "CRITICAL"},
    )
    assert updated.status_code == 200, updated.get_json()
    assert updated.get_json()["title"] == "Updated collision title"
    assert updated.get_json()["urgency"] == "CRITICAL"
    assert updated.get_json()["status"] == "PENDING"

    archived = client.post(
        f"/api/v1/incidents/{incident_id}/archive",
        headers=admin,
        json={"reason": "Duplicate of AJL-9001"},
    )
    assert archived.status_code == 200, archived.get_json()
    assert archived.get_json()["archived"] is True
    assert archived.get_json()["archiveReason"] == "Duplicate of AJL-9001"

    denied = client.post(
        f"/api/v1/incidents/{incident_id}/archive",
        headers=citizen,
        json={"reason": "should fail"},
    )
    assert denied.status_code == 403

    edit_archived = client.patch(
        f"/api/v1/incidents/{incident_id}",
        headers=admin,
        json={"title": "nope"},
    )
    assert edit_archived.status_code == 409

    listed = client.get("/api/v1/incidents", headers=admin)
    assert listed.status_code == 200
    assert all(item["id"] != incident_id for item in listed.get_json()["items"])

    with_archived = client.get(
        "/api/v1/incidents?includeArchived=true",
        headers=admin,
    )
    assert any(item["id"] == incident_id for item in with_archived.get_json()["items"])
