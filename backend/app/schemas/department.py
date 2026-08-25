from marshmallow import Schema, fields


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
