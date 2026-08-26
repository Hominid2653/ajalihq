from flask_jwt_extended import decode_token

from app.extensions import db
from app.middleware.auth import role_required
from app.models import User
from app.utils.passwords import hash_password


def test_register_login_me(client):
    register = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Citizen",
            "email": "citizen@example.com",
            "password": "password123",
            "phone": "+254700000001",
            "idNumber": "12345678",
        },
    )
    assert register.status_code == 201, register.get_json()
    body = register.get_json()
    assert body["email"] == "citizen@example.com"
    assert body["role"] == "USER"
    assert body["verified"] is True
    assert body["profileComplete"] is True
    assert "password" not in body

    duplicate = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Other",
            "email": "citizen@example.com",
            "password": "password123",
            "phone": "+254700000002",
        },
    )
    assert duplicate.status_code == 409

    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "citizen@example.com", "password": "wrong-password"},
    )
    assert bad_login.status_code == 401

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "citizen@example.com", "password": "password123"},
    )
    assert login.status_code == 200, login.get_json()
    token = login.get_json()["accessToken"]
    assert login.get_json()["user"]["role"] == "USER"

    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200
    assert me.get_json()["email"] == "citizen@example.com"

    patched = client.patch(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"location": "Nairobi", "bio": "Reporter"},
    )
    assert patched.status_code == 200, patched.get_json()
    assert patched.get_json()["location"] == "Nairobi"
    assert patched.get_json()["bio"] == "Reporter"

    unauth = client.get("/api/v1/auth/me")
    assert unauth.status_code == 401


def test_admin_role_guard(client, app):
    with app.app_context():
        db.session.add(
            User(
                name="Admin",
                email="admin@example.com",
                password_hash=hash_password("password123"),
                role_code="ADMIN",
                phone="+254711000000",
                preferred_contact_method="PHONE",
                profile_complete=True,
                id_verified=False,
            )
        )
        db.session.commit()

    @app.get("/_probe/admin-only")
    @role_required("ADMIN")
    def admin_only():
        return {"ok": True}

    user_reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Citizen",
            "email": "user@example.com",
            "password": "password123",
            "phone": "+254700000099",
        },
    )
    assert user_reg.status_code == 201

    user_login = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    user_token = user_login.get_json()["accessToken"]
    assert decode_token(user_token)["role"] == "USER"

    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "password123"},
    )
    admin_token = admin_login.get_json()["accessToken"]
    assert decode_token(admin_token)["role"] == "ADMIN"

    denied = client.get(
        "/_probe/admin-only",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert denied.status_code == 403

    allowed = client.get(
        "/_probe/admin-only",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert allowed.status_code == 200
    assert allowed.get_json()["ok"] is True
