from marshmallow import Schema, fields, validate


DEPARTMENT_TYPES = [
    "POLICE",
    "FIRE",
    "HOSPITAL",
    "AMBULANCE",
    "DISASTER_RESPONSE",
    "OTHER",
]


class DepartmentSchema(Schema):
    id = fields.String(required=True)
    name = fields.String(required=True)
    type = fields.String(required=True)
    description = fields.String(allow_none=True)
    phone = fields.String(allow_none=True)
    email = fields.String(allow_none=True)
    location = fields.String(allow_none=True)
    active = fields.Boolean(required=True)
    createdAt = fields.String(required=True)
    updatedAt = fields.String(required=True)


class DepartmentListQuerySchema(Schema):
    activeOnly = fields.Boolean(
        load_default=False,
        metadata={
            "description": "If true, only return active departments (useful for start-response pickers).",
            "example": True,
        },
    )


class CreateDepartmentSchema(Schema):
    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=200),
        metadata={"example": "Nairobi Central Ambulance"},
    )
    type = fields.String(
        required=True,
        validate=validate.OneOf(DEPARTMENT_TYPES),
        metadata={"example": "AMBULANCE"},
    )
    description = fields.String(
        load_default=None,
        allow_none=True,
        metadata={"example": "24/7 EMS unit covering CBD."},
    )
    phone = fields.String(
        load_default=None,
        allow_none=True,
        metadata={"example": "+254720000000"},
    )
    email = fields.Email(
        load_default=None,
        allow_none=True,
        metadata={"example": "dispatch@ambulance.example.ke"},
    )
    location = fields.String(
        load_default=None,
        allow_none=True,
        metadata={"example": "Nairobi"},
    )
    active = fields.Boolean(load_default=True, metadata={"example": True})


class UpdateDepartmentSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=200))
    type = fields.String(validate=validate.OneOf(DEPARTMENT_TYPES))
    description = fields.String(allow_none=True)
    phone = fields.String(allow_none=True, metadata={"example": "+254720000001"})
    email = fields.Email(allow_none=True)
    location = fields.String(allow_none=True)
    active = fields.Boolean()
