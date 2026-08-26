from marshmallow import Schema, fields, validate


INCIDENT_TYPES = ["accident", "fire", "medical", "crime", "disaster"]
URGENCIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
SEVERITIES = ["MINOR", "MODERATE", "MAJOR", "CRITICAL"]
CONTACT_METHODS = ["PHONE", "EMAIL", "OTHER"]


class IncidentSchema(Schema):
    id = fields.String(required=True)
    reference = fields.String(required=True)
    title = fields.String(required=True)
    description = fields.String(required=True)
    type = fields.String(required=True)
    urgency = fields.String(required=True)
    severity = fields.String(required=True)
    status = fields.String(required=True)
    location = fields.String(required=True)
    lat = fields.Float(allow_none=True)
    lng = fields.Float(allow_none=True)
    userId = fields.String(required=True)
    reporterName = fields.String(allow_none=True)
    reporterEmail = fields.String(allow_none=True)
    reporterPhone = fields.String(allow_none=True)
    preferredContactMethod = fields.String(allow_none=True)
    verificationId = fields.String(allow_none=True)
    closeReasonCode = fields.String(allow_none=True)
    resolutionSummary = fields.String(allow_none=True)
    resolutionNotes = fields.String(allow_none=True)
    resolutionOutcome = fields.String(allow_none=True)
    resolvedById = fields.String(allow_none=True)
    resolvedByName = fields.String(allow_none=True)
    resolvedAt = fields.String(allow_none=True)
    archived = fields.Boolean(required=True)
    archiveReason = fields.String(allow_none=True)
    createdAt = fields.String(required=True)
    updatedAt = fields.String(required=True)


class IncidentListItemSchema(IncidentSchema):
    verificationStatus = fields.String(required=True)


class IncidentListQuerySchema(Schema):
    userId = fields.String(load_default=None)
    status = fields.String(load_default=None)
    statusIn = fields.List(fields.String(), load_default=None)
    urgency = fields.String(load_default=None)
    severity = fields.String(load_default=None)
    type = fields.String(load_default=None)
    departmentId = fields.String(load_default=None)
    verificationStatus = fields.String(load_default=None)
    location = fields.String(load_default=None)
    search = fields.String(load_default=None)
    dateFrom = fields.String(load_default=None)
    dateTo = fields.String(load_default=None)
    sort = fields.String(
        load_default="urgency",
        validate=validate.OneOf(["urgency", "newest"]),
    )
    includeArchived = fields.Boolean(load_default=False)
    limit = fields.Integer(load_default=50)
    offset = fields.Integer(load_default=0)


class IncidentListPageSchema(Schema):
    items = fields.List(fields.Nested(IncidentListItemSchema), required=True)
    total = fields.Integer(required=True)
    limit = fields.Integer(required=True)
    offset = fields.Integer(required=True)
    hasMore = fields.Boolean(required=True)


class NoteSchema(Schema):
    id = fields.String(required=True)
    incidentId = fields.String(required=True)
    authorId = fields.String(required=True)
    authorName = fields.String(required=True)
    body = fields.String(required=True)
    createdAt = fields.String(required=True)


class MediaSchema(Schema):
    id = fields.String(required=True)
    incidentId = fields.String(required=True)
    kind = fields.String(required=True)
    url = fields.String(required=True)
    name = fields.String(required=True)
    createdAt = fields.String(required=True)


class StatusHistorySchema(Schema):
    id = fields.String(required=True)
    incidentId = fields.String(required=True)
    fromStatus = fields.String(allow_none=True)
    toStatus = fields.String(required=True)
    actorId = fields.String(required=True)
    actorName = fields.String(required=True)
    reason = fields.String(allow_none=True)
    createdAt = fields.String(required=True)


class VerificationSchema(Schema):
    id = fields.String(required=True)
    incidentId = fields.String(required=True)
    status = fields.String(required=True)
    method = fields.String(allow_none=True)
    notes = fields.String(allow_none=True)
    verifiedById = fields.String(allow_none=True)
    verifiedByName = fields.String(allow_none=True)
    verifiedAt = fields.String(allow_none=True)
    createdAt = fields.String(required=True)
    updatedAt = fields.String(required=True)


class HandoffSchema(Schema):
    id = fields.String(required=True)
    incidentId = fields.String(required=True)
    departmentId = fields.String(required=True)
    initiatedById = fields.String(required=True)
    initiatedByName = fields.String(required=True)
    status = fields.String(required=True)
    notes = fields.String(allow_none=True)
    handedOffAt = fields.String(required=True)
    acknowledgedAt = fields.String(allow_none=True)
    completedAt = fields.String(allow_none=True)
    updatedAt = fields.String(required=True)


class IncidentDetailSchema(Schema):
    """Aggregate payload for review / detail screens."""

    incident = fields.Nested(IncidentSchema, required=True)
    history = fields.List(fields.Nested(StatusHistorySchema), required=True)
    notes = fields.List(fields.Nested(NoteSchema), required=True)
    media = fields.List(fields.Nested(MediaSchema), required=True)
    verification = fields.Nested(VerificationSchema, allow_none=True)
    verifications = fields.List(fields.Nested(VerificationSchema), required=True)
    handoffs = fields.List(fields.Nested(HandoffSchema), required=True)


class MediaInputSchema(Schema):
    kind = fields.String(required=True, validate=validate.OneOf(["image", "video"]))
    url = fields.String(required=True, validate=validate.Length(min=1, max=2000))
    name = fields.String(required=True, validate=validate.Length(min=1, max=500))


class CreateIncidentSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=300))
    description = fields.String(required=True, validate=validate.Length(min=1, max=10000))
    type = fields.String(load_default="accident", validate=validate.OneOf(INCIDENT_TYPES))
    urgency = fields.String(load_default="MEDIUM", validate=validate.OneOf(URGENCIES))
    severity = fields.String(load_default="MODERATE", validate=validate.OneOf(SEVERITIES))
    location = fields.String(required=True, validate=validate.Length(min=1, max=500))
    lat = fields.Float(load_default=None, allow_none=True)
    lng = fields.Float(load_default=None, allow_none=True)
    userId = fields.String(load_default=None, allow_none=True)
    reporterName = fields.String(load_default=None, allow_none=True)
    reporterEmail = fields.String(load_default=None, allow_none=True)
    reporterPhone = fields.String(load_default=None, allow_none=True)
    preferredContactMethod = fields.String(
        load_default="PHONE",
        validate=validate.OneOf(CONTACT_METHODS),
    )
    media = fields.List(fields.Nested(MediaInputSchema), load_default=None)


class UpdateIncidentSchema(Schema):
    """Partial update — only fields present in the request body are applied."""

    title = fields.String(validate=validate.Length(min=1, max=300))
    description = fields.String(validate=validate.Length(min=1, max=10000))
    type = fields.String(validate=validate.OneOf(INCIDENT_TYPES))
    urgency = fields.String(validate=validate.OneOf(URGENCIES))
    severity = fields.String(validate=validate.OneOf(SEVERITIES))
    location = fields.String(validate=validate.Length(min=1, max=500))
    lat = fields.Float(allow_none=True)
    lng = fields.Float(allow_none=True)
    userId = fields.String(allow_none=True)
    reporterName = fields.String(allow_none=True)
    reporterEmail = fields.String(allow_none=True)
    reporterPhone = fields.String(allow_none=True)
    preferredContactMethod = fields.String(validate=validate.OneOf(CONTACT_METHODS))


class ArchiveIncidentSchema(Schema):
    reason = fields.String(required=True, validate=validate.Length(min=1, max=2000))


CLOSE_REASONS = [
    "FALSE_REPORT",
    "DUPLICATE",
    "UNABLE_TO_VERIFY",
    "INSUFFICIENT_INFORMATION",
    "OTHER",
]
VERIFICATION_METHODS = ["PHONE", "EMAIL", "OTHER"]
RESOLUTION_OUTCOMES = [
    "RESOLVED",
    "ASSISTANCE_PROVIDED",
    "REFERRED",
    "UNABLE_TO_ASSIST",
    "OTHER",
]


class VerifyIncidentSchema(Schema):
    method = fields.String(required=True, validate=validate.OneOf(VERIFICATION_METHODS))
    notes = fields.String(load_default=None, allow_none=True)


class CloseIncidentSchema(Schema):
    reason = fields.String(required=True, validate=validate.Length(min=1, max=2000))
    reasonCode = fields.String(
        load_default="OTHER",
        validate=validate.OneOf(CLOSE_REASONS),
    )
    failVerification = fields.Boolean(load_default=False)


class StartResponseSchema(Schema):
    departmentIds = fields.List(
        fields.String(),
        required=True,
        validate=validate.Length(min=1),
    )
    notes = fields.String(load_default=None, allow_none=True)


class NotifyCitizenSchema(Schema):
    sms = fields.Boolean(load_default=False)
    email = fields.Boolean(load_default=False)


class ResolveIncidentSchema(Schema):
    summary = fields.String(required=True, validate=validate.Length(min=1, max=5000))
    notes = fields.String(load_default=None, allow_none=True)
    outcome = fields.String(required=True, validate=validate.OneOf(RESOLUTION_OUTCOMES))
    completeHandoffs = fields.Boolean(load_default=True)
    notifyCitizen = fields.Nested(NotifyCitizenSchema, load_default=None)


class ReopenIncidentSchema(Schema):
    reason = fields.String(required=True, validate=validate.Length(min=1, max=2000))


class AddNoteSchema(Schema):
    body = fields.String(required=True, validate=validate.Length(min=1, max=10000))


class AddMediaSchema(Schema):
    kind = fields.String(required=True, validate=validate.OneOf(["image", "video"]))
    url = fields.String(required=True, validate=validate.Length(min=1, max=2000))
    name = fields.String(required=True, validate=validate.Length(min=1, max=500))


class UpdateHandoffSchema(Schema):
    status = fields.String(
        required=True,
        validate=validate.OneOf(
            ["PENDING", "ACKNOWLEDGED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
        ),
    )
    notes = fields.String(allow_none=True)


class CompleteHandoffSchema(Schema):
    notes = fields.String(load_default=None, allow_none=True)
