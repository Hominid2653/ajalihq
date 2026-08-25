"""Auth / RBAC helpers."""

from __future__ import annotations

from functools import wraps
from typing import Callable
from uuid import UUID

from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
from flask_smorest import abort

from app.extensions import db
from app.models import User


def get_current_user() -> User:
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    try:
        uid = UUID(str(user_id))
    except (TypeError, ValueError):
        abort(401, message="Invalid authentication token.")
    user = db.session.get(User, uid)
    if user is None:
        abort(401, message="User not found.")
    return user


def role_required(*roles: str) -> Callable:
    """Require a valid JWT whose role claim is one of ``roles``."""

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role")
            if role not in roles:
                abort(403, message="You do not have permission to perform this action.")
            return fn(*args, **kwargs)

        return wrapper

    return decorator
