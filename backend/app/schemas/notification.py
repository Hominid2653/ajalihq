from marshmallow import Schema, fields, validate


class NotificationSchema(Schema):
    id = fields.String(required=True)
    incidentId = fields.String(allow_none=True)
    type = fields.String(required=True)
    channel = fields.String(required=True)
    title = fields.String(required=True)
    body = fields.String(required=True)
    read = fields.Boolean(required=True)
    createdAt = fields.String(required=True)


class MarkAllReadResponseSchema(Schema):
    count = fields.Integer(required=True)


class NotificationListQuerySchema(Schema):
    limit = fields.Integer(load_default=50)
    offset = fields.Integer(load_default=0)


class NotificationPageSchema(Schema):
    items = fields.List(fields.Nested(NotificationSchema), required=True)
    total = fields.Integer(required=True)
    limit = fields.Integer(required=True)
    offset = fields.Integer(required=True)
    hasMore = fields.Boolean(required=True)


class CreateNotificationSchema(Schema):
    incidentId = fields.String(load_default=None, allow_none=True)
    recipientId = fields.String(load_default=None, allow_none=True)
    type = fields.String(required=True, validate=validate.Length(min=1, max=80))
    channel = fields.String(
        required=True,
        validate=validate.OneOf(["IN_APP", "EMAIL", "SMS"]),
    )
    title = fields.String(required=True, validate=validate.Length(min=1, max=300))
    body = fields.String(required=True, validate=validate.Length(min=1, max=5000))
