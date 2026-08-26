"""Department read/write queries."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from flask_smorest import abort
from sqlalchemy import select

from app.extensions import db
from app.models import AuditLog, Department, User
from app.utils.serialize import department_to_dict


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _require_admin(actor: User) -> None:
    if actor.role_code != "ADMIN":
        abort(403, message="Only admins can manage departments.")


def list_departments(*, active_only: bool = False) -> list[dict[str, Any]]:
    stmt = select(Department)
    if active_only:
        stmt = stmt.where(Department.active.is_(True))
    stmt = stmt.order_by(Department.name.asc())
    return [department_to_dict(row) for row in db.session.scalars(stmt).all()]


def get_department(department_id: str) -> dict[str, Any]:
    try:
        uid = UUID(department_id)
    except ValueError:
        abort(400, message="Invalid department id.")
    row = db.session.get(Department, uid)
    if row is None:
        abort(404, message="Department not found.")
    return department_to_dict(row)


def create_department(data: dict[str, Any], actor: User) -> dict[str, Any]:
    _require_admin(actor)
    name = data["name"].strip()
    if not name:
        abort(400, message="Department name is required.")

    now = _utcnow()
    department = Department(
        name=name,
        type_code=data["type"],
        description=(data.get("description") or "").strip() or None,
        phone=(data.get("phone") or "").strip() or None,
        email=(data.get("email") or "").strip() or None,
        location=(data.get("location") or "").strip() or None,
        active=bool(data.get("active", True)),
        created_at=now,
        updated_at=now,
    )
    db.session.add(department)
    db.session.flush()
    db.session.add(
        AuditLog(
            entity_type="department",
            entity_id=department.id,
            actor_id=actor.id,
            actor_name=actor.name,
            action_code="DEPARTMENT_CREATED",
            new_value=department.name,
            metadata_={"departmentId": str(department.id)},
            created_at=now,
        )
    )
    db.session.commit()
    return department_to_dict(department)


def update_department(
    department_id: str, patch: dict[str, Any], actor: User
) -> dict[str, Any]:
    _require_admin(actor)
    try:
        uid = UUID(department_id)
    except ValueError:
        abort(400, message="Invalid department id.")
    department = db.session.get(Department, uid)
    if department is None:
        abort(404, message="Department not found.")

    previous_name = department.name
    if "name" in patch and patch["name"] is not None:
        name = patch["name"].strip()
        if not name:
            abort(400, message="Department name is required.")
        department.name = name
    if "type" in patch and patch["type"] is not None:
        department.type_code = patch["type"]
    if "description" in patch:
        raw = patch["description"]
        department.description = (raw or "").strip() or None
    if "phone" in patch:
        raw = patch["phone"]
        department.phone = (raw or "").strip() or None
    if "email" in patch:
        raw = patch["email"]
        department.email = (raw or "").strip() or None
    if "location" in patch:
        raw = patch["location"]
        department.location = (raw or "").strip() or None
    if "active" in patch and patch["active"] is not None:
        department.active = bool(patch["active"])

    now = _utcnow()
    department.updated_at = now
    db.session.add(
        AuditLog(
            entity_type="department",
            entity_id=department.id,
            actor_id=actor.id,
            actor_name=actor.name,
            action_code="DEPARTMENT_UPDATED",
            previous_value=previous_name,
            new_value=department.name,
            metadata_={"departmentId": str(department.id)},
            created_at=now,
        )
    )
    db.session.commit()
    return department_to_dict(department)


def set_department_active(
    department_id: str, active: bool, actor: User
) -> dict[str, Any]:
    return update_department(department_id, {"active": active}, actor)
