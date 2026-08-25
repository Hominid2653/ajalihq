"""Seed demo USER + ADMIN accounts (idempotent). Requires lookup seed first."""

from __future__ import annotations

import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import select

from app import create_app
from app.extensions import db
from app.models import User
from app.utils.passwords import hash_password
from scripts.seed_lookups import seed_lookups

DEMO_PASSWORD = "password"

DEMO_USERS = [
    {
        "id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
        "name": "Amina Otieno",
        "email": "amina@ajalihq.test",
        "role_code": "USER",
        "phone": "+254700111222",
        "location": "Nairobi",
        "id_number": "28473615",
    },
    {
        "id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
        "name": "Brian Mwangi",
        "email": "brian@ajalihq.test",
        "role_code": "ADMIN",
        "phone": "+254711222333",
        "location": "Nairobi",
        "id_number": "29104582",
    },
]


def seed_demo_users() -> None:
    seed_lookups()
    password_hash = hash_password(DEMO_PASSWORD)

    for spec in DEMO_USERS:
        existing = db.session.scalar(select(User).where(User.email == spec["email"]))
        if existing is not None:
            existing.password_hash = password_hash
            existing.role_code = spec["role_code"]
            existing.name = spec["name"]
            existing.phone = spec["phone"]
            existing.location = spec["location"]
            existing.id_number = spec["id_number"]
            existing.id_verified = True
            existing.profile_complete = True
            existing.preferred_contact_method = "PHONE"
            continue

        db.session.add(
            User(
                id=spec["id"],
                name=spec["name"],
                email=spec["email"],
                password_hash=password_hash,
                role_code=spec["role_code"],
                phone=spec["phone"],
                location=spec["location"],
                preferred_contact_method="PHONE",
                profile_complete=True,
                id_number=spec["id_number"],
                id_verified=True,
            )
        )

    db.session.commit()


def main() -> None:
    app = create_app()
    with app.app_context():
        seed_demo_users()
        print("Demo users ready:")
        print("  amina@ajalihq.test / password  (USER)")
        print("  brian@ajalihq.test / password  (ADMIN)")


if __name__ == "__main__":
    main()
