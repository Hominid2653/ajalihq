"""Department read queries."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from flask_smorest import abort
from sqlalchemy import select

from app.extensions import db
from app.models import Department
from app.utils.serialize import department_to_dict


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
