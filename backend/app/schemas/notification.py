from marshmallow import Schema, fields, validate


NOTIFICATION_EVENT_TYPES = [
    "REPORT_RECEIVED",
    "CRITICAL_REPORT_RECEIVED",
    "REPORT_VERIFIED",
    "REPORT_CLOSED",
    "RESPONSE_STARTED",
    "DEPARTMENT_ASSIGNED",
    "INCIDENT_RESOLVED",
    "INCIDENT_ARCHIVED",
    "CITIZEN_STATUS_NOTIFY",
    "CRITICAL_INCIDENT",
    "STATUS_IN_PROGRESS",
]


class NotificationSchema(Schema):
    id = fields.String(required=True)
    incidentId = fields.String(allow_none=True)
    type = fields.String(required=True)
    channel = fields.String(required=True)
    title = fields.String(required=True)
    body = fields.String(required=True)
    read = fields.Boolean(required=True)
    createdAt = fields.String(required=True)
    deliveryStatus = fields.String(allow_none=True)
    metadata = fields.Dict(allow_none=True)


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
    """Admin enqueue — Swagger Try it out uses a realistic EMAIL example."""

    incidentId = fields.String(
        load_default=None,
        allow_none=True,
        metadata={
            "description": "Optional incident UUID to link the notification.",
            "example": None,
        },
    )
    recipientId = fields.String(
        load_default=None,
        allow_none=True,
        metadata={
            "description": "Optional user UUID; email/phone may be taken from this user.",
            "example": None,
        },
    )
    toEmail = fields.Email(
        load_default=None,
        allow_none=True,
        metadata={
            "description": (
                "Destination for EMAIL. With onboarding@resend.dev, use your Resend login email."
            ),
            "example": "you@example.com",
        },
    )
    type = fields.String(
        required=True,
        validate=validate.OneOf(NOTIFICATION_EVENT_TYPES),
        metadata={"example": "CITIZEN_STATUS_NOTIFY"},
    )
    channel = fields.String(
        required=True,
        validate=validate.OneOf(["IN_APP", "EMAIL", "SMS"]),
        metadata={"example": "EMAIL"},
    )
    title = fields.String(
        required=True,
        validate=validate.Length(min=1, max=300),
        metadata={"example": "Ajali! test"},
    )
    body = fields.String(
        required=True,
        validate=validate.Length(min=1, max=5000),
        metadata={"example": "Hello from Ajali backend"},
    )
