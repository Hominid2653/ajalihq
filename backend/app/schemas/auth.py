from marshmallow import Schema, fields, validate


class AuthUserSchema(Schema):
    """Matches frontend ``AuthUser`` (camelCase JSON)."""

    id = fields.UUID(required=True)
    name = fields.String(required=True)
    email = fields.Email(required=True)
    role = fields.String(required=True, metadata={"example": "USER"})
    phone = fields.String(allow_none=True, metadata={"example": "+254700000001"})
    avatarUrl = fields.String(allow_none=True, attribute="avatar_url")
    location = fields.String(allow_none=True, metadata={"example": "Nairobi"})
    bio = fields.String(allow_none=True)
    preferredContactMethod = fields.String(
        allow_none=True, attribute="preferred_contact_method"
    )
    profileComplete = fields.Boolean(attribute="profile_complete")
    idNumber = fields.String(allow_none=True, attribute="id_number")
    verified = fields.Boolean(attribute="id_verified")


class RegisterSchema(Schema):
    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=200),
        metadata={"example": "Test Citizen"},
    )
    email = fields.Email(
        required=True,
        metadata={"example": "new-citizen@example.com"},
    )
    password = fields.String(
        required=True,
        validate=validate.Length(min=6, max=128),
        metadata={
            "description": "Min 6 characters (matches SignUp UI).",
            "example": "password123",
        },
    )
    phone = fields.String(
        load_default=None,
        allow_none=True,
        metadata={"example": "+254700000001"},
    )
    avatarUrl = fields.String(load_default=None, allow_none=True)
    location = fields.String(
        load_default=None,
        allow_none=True,
        metadata={"example": "Nairobi"},
    )
    idNumber = fields.String(
        load_default=None,
        allow_none=True,
        metadata={
            "description": "Kenyan national ID — 7–8 digits.",
            "example": "12345678",
        },
    )
    preferredContactMethod = fields.String(
        load_default="PHONE",
        validate=validate.OneOf(["PHONE", "EMAIL", "OTHER"]),
        metadata={"example": "PHONE"},
    )


class LoginSchema(Schema):
    email = fields.Email(
        required=True,
        metadata={
            "description": "Demo admin: brian@ajalihq.test · Demo citizen: amina@ajalihq.test",
            "example": "brian@ajalihq.test",
        },
    )
    password = fields.String(
        required=True,
        validate=validate.Length(min=1, max=128),
        metadata={
            "description": "Demo password for seeded users: password",
            "example": "password",
        },
    )


class LoginResponseSchema(Schema):
    accessToken = fields.String(
        required=True,
        metadata={"description": "Paste into Swagger Authorize (BearerAuth)."},
    )
    user = fields.Nested(AuthUserSchema, required=True)


class UpdateProfileSchema(Schema):
    """Partial profile update for PATCH /auth/me."""

    name = fields.String(
        validate=validate.Length(min=1, max=200),
        metadata={"example": "Amina Wanjiku"},
    )
    phone = fields.String(allow_none=True, metadata={"example": "+254712345678"})
    location = fields.String(allow_none=True, metadata={"example": "Nairobi, Kenya"})
    bio = fields.String(allow_none=True, metadata={"example": "Community reporter"})
    avatarUrl = fields.String(allow_none=True)
    preferredContactMethod = fields.String(
        validate=validate.OneOf(["PHONE", "EMAIL", "OTHER"]),
        metadata={"example": "PHONE"},
    )
    idNumber = fields.String(allow_none=True, metadata={"example": "31266740"})
