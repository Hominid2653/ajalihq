from marshmallow import Schema, fields, validate


class AuthUserSchema(Schema):
    """Matches frontend ``AuthUser`` (camelCase JSON)."""

    id = fields.UUID(required=True)
    name = fields.String(required=True)
    email = fields.Email(required=True)
    role = fields.String(required=True)
    phone = fields.String(allow_none=True)
    avatarUrl = fields.String(allow_none=True, attribute="avatar_url")
    location = fields.String(allow_none=True)
    bio = fields.String(allow_none=True)
    preferredContactMethod = fields.String(
        allow_none=True, attribute="preferred_contact_method"
    )
    profileComplete = fields.Boolean(attribute="profile_complete")
    idNumber = fields.String(allow_none=True, attribute="id_number")
    verified = fields.Boolean(attribute="id_verified")


class RegisterSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))
    phone = fields.String(load_default=None, allow_none=True)
    avatarUrl = fields.String(load_default=None, allow_none=True)
    location = fields.String(load_default=None, allow_none=True)
    idNumber = fields.String(load_default=None, allow_none=True)
    preferredContactMethod = fields.String(
        load_default="PHONE",
        validate=validate.OneOf(["PHONE", "EMAIL", "OTHER"]),
    )


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=1, max=128))


class LoginResponseSchema(Schema):
    accessToken = fields.String(required=True)
    user = fields.Nested(AuthUserSchema, required=True)
