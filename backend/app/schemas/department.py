from marshmallow import Schema, fields, validate


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
    activeOnly = fields.Boolean(load_default=False)


DEPARTMENT_TYPES = [
    "POLICE",
    "FIRE",
    "HOSPITAL",
    "AMBULANCE",
    "DISASTER_RESPONSE",
    "OTHER",
]


class CreateDepartmentSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    type = fields.String(required=True, validate=validate.OneOf(DEPARTMENT_TYPES))
    description = fields.String(load_default=None, allow_none=True)
    phone = fields.String(load_default=None, allow_none=True)
    email = fields.String(load_default=None, allow_none=True)
    location = fields.String(load_default=None, allow_none=True)
    active = fields.Boolean(load_default=True)


class UpdateDepartmentSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=200))
    type = fields.String(validate=validate.OneOf(DEPARTMENT_TYPES))
    description = fields.String(allow_none=True)
    phone = fields.String(allow_none=True)
    email = fields.String(allow_none=True)
    location = fields.String(allow_none=True)
    active = fields.Boolean()
