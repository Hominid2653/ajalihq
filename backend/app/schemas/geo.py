from marshmallow import Schema, fields, validate


class GeocodePlaceSchema(Schema):
    label = fields.String(required=True)
    lat = fields.Float(required=True)
    lng = fields.Float(required=True)
    countryCode = fields.String(allow_none=True)


class GeocodeSearchQuerySchema(Schema):
    q = fields.String(
        required=True,
        validate=validate.Length(min=2, max=80),
        metadata={
            "description": "Place name only (no URLs/HTML). Kenya-scoped.",
            "example": "Nairobi",
        },
    )
    limit = fields.Integer(
        load_default=8,
        validate=validate.Range(min=1, max=8),
        metadata={"example": 5},
    )


class ReverseGeocodeQuerySchema(Schema):
    lat = fields.Float(
        required=True,
        metadata={"description": "Latitude (-90..90)", "example": -1.2864},
    )
    lng = fields.Float(
        required=True,
        metadata={"description": "Longitude (-180..180)", "example": 36.8172},
    )
    limit = fields.Integer(
        load_default=1,
        validate=validate.Range(min=1, max=5),
        metadata={"example": 1},
    )


class WeatherCurrentQuerySchema(Schema):
    lat = fields.Float(
        required=True,
        metadata={"description": "Latitude (-90..90)", "example": -1.2864},
    )
    lng = fields.Float(
        required=True,
        metadata={"description": "Longitude (-180..180)", "example": 36.8172},
    )


class SiteConditionsSchema(Schema):
    """Aligned with frontend ``SiteConditions`` (+ provider metadata)."""

    temperatureC = fields.Float(allow_none=True)
    windKmh = fields.Float(allow_none=True)
    precipitationMm = fields.Float(allow_none=True)
    summary = fields.String(required=True)
    provider = fields.String(required=True)
    lat = fields.Float(required=True)
    lng = fields.Float(required=True)
