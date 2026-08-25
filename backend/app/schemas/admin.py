from marshmallow import Schema, fields


class DashboardStatsSchema(Schema):
    total = fields.Integer(required=True)
    pending = fields.Integer(required=True)
    verified = fields.Integer(required=True)
    inProgress = fields.Integer(required=True)
    resolved = fields.Integer(required=True)
    closed = fields.Integer(required=True)
    criticalUrgency = fields.Integer(required=True)
    criticalSeverity = fields.Integer(required=True)
    awaitingVerification = fields.Integer(required=True)
    awaitingResponse = fields.Integer(required=True)
    awaitingHandoffAck = fields.Integer(required=True)
    today = fields.Integer(required=True)


class AuditLogSchema(Schema):
    id = fields.String(required=True)
    incidentId = fields.String(allow_none=True)
    incidentReference = fields.String(allow_none=True)
    actorId = fields.String(required=True)
    actorName = fields.String(required=True)
    action = fields.String(required=True)
    previousValue = fields.String(allow_none=True)
    newValue = fields.String(allow_none=True)
    reason = fields.String(allow_none=True)
    metadata = fields.String(allow_none=True)
    createdAt = fields.String(required=True)


class AuditLogQuerySchema(Schema):
    incidentId = fields.String(load_default=None)
