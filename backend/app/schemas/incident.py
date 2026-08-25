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
