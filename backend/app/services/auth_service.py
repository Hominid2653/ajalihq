"""Authentication service — register, login, serialize users."""

from __future__ import annotations

from typing import Any

from flask_jwt_extended import create_access_token
from flask_smorest import abort
from sqlalchemy import select

from app.extensions import db
from app.models import User
from app.utils.ids import is_valid_id_number, normalize_id_number
from app.utils.passwords import hash_password, verify_password


def user_to_auth_dict(user: User) -> dict[str, Any]:
    """Shape matching frontend AuthUser / AuthUserSchema attributes."""
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role_code,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "location": user.location,
        "bio": user.bio,
        "preferred_contact_method": user.preferred_contact_method,
        "profile_complete": user.profile_complete,
        "id_number": user.id_number,
        "id_verified": user.id_verified,
    }


def register_user(
    *,
    name: str,
    email: str,
    password: str,
    phone: str | None = None,
    avatar_url: str | None = None,
    location: str | None = None,
    id_number: str | None = None,
    preferred_contact_method: str = "PHONE",
) -> User:
    normalized_email = email.strip().lower()
    existing = db.session.scalar(select(User).where(User.email == normalized_email))
    if existing is not None:
        abort(409, message="An account with that email already exists.")

    normalized_id = normalize_id_number(id_number)
    if id_number and not is_valid_id_number(normalized_id):
        abort(400, message="National ID must be 7–8 digits.")
    if normalized_id:
        taken = db.session.scalar(select(User).where(User.id_number == normalized_id))
        if taken is not None:
            abort(409, message="That ID number is already linked to another account.")

    clean_name = name.strip()
    clean_phone = phone.strip() if phone else None
    user = User(
        name=clean_name,
        email=normalized_email,
        password_hash=hash_password(password),
        role_code="USER",
        phone=clean_phone,
        avatar_url=avatar_url or None,
        location=location.strip() if location else None,
        preferred_contact_method=preferred_contact_method or "PHONE",
        profile_complete=bool(clean_name and clean_phone),
        id_number=normalized_id,
        id_verified=bool(normalized_id and is_valid_id_number(normalized_id)),
    )
    db.session.add(user)
    db.session.commit()
    return user


def authenticate(email: str, password: str) -> tuple[str, User]:
    normalized_email = email.strip().lower()
    user = db.session.scalar(select(User).where(User.email == normalized_email))
    if user is None or not verify_password(user.password_hash, password):
        abort(401, message="Invalid email or password.")

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role_code, "email": user.email},
    )
    return token, user
