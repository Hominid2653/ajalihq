"""Unit tests for Resend email adapter + dispatch dry-run."""

from app.extensions import db
from app.models import Notification, User
from app.services import email_service
from app.services.notification_dispatch import dispatch_notification
from app.utils.passwords import hash_password
from uuid import uuid4


def test_email_dry_run_without_api_key(app):
    with app.app_context():
        result = email_service.send_email(
            to="citizen@example.com",
            subject="Hello",
            text="Body",
        )
        assert result.status == "dry_run"


def test_dispatch_email_updates_metadata(app):
    with app.app_context():
        user = User(
            id=uuid4(),
            name="Mail Citizen",
            email="mail-citizen@example.com",
            password_hash=hash_password("password123"),
            role_code="USER",
            phone="+254700000099",
            preferred_contact_method="EMAIL",
            profile_complete=True,
            id_verified=False,
        )
        db.session.add(user)
        db.session.flush()
        note = Notification(
            id=uuid4(),
            recipient_id=user.id,
            type_code="CITIZEN_STATUS_NOTIFY",
            channel_code="EMAIL",
            title="Resolved",
            body="Your report is resolved.",
            read=False,
            metadata_={"destination": user.email, "deliveryStatus": "pending"},
        )
        db.session.add(note)
        db.session.commit()

        result = dispatch_notification(note.id)
        assert result["deliveryStatus"] == "dry_run"

        refreshed = db.session.get(Notification, note.id)
        assert refreshed.metadata_["deliveryStatus"] == "dry_run"
        assert refreshed.metadata_["provider"] == "resend"
