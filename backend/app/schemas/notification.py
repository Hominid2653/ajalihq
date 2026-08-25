from marshmallow import Schema, fields


class NotificationSchema(Schema):
    id = fields.String(required=True)
    incidentId = fields.String(allow_none=True)
    type = fields.String(required=True)
    channel = fields.String(required=True)
    title = fields.String(required=True)
    body = fields.String(required=True)
    read = fields.Boolean(required=True)
    createdAt = fields.String(required=True)
