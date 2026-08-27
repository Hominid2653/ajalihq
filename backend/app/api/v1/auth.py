from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.middleware.auth import get_current_user
from app.middleware.rate_limit import rate_limit
from app.schemas.auth import (
    AuthUserSchema,
    LoginResponseSchema,
    LoginSchema,
    RegisterSchema,
    UpdateProfileSchema,
)
from app.services import auth_service

blp = Blueprint(
    "Auth",
    "auth",
    url_prefix="/api/v1/auth",
    description="Citizen and admin authentication (JWT).",
)


@blp.route("/register")
class RegisterResource(MethodView):
    @rate_limit(scope="register")
    @blp.arguments(RegisterSchema)
    @blp.response(201, AuthUserSchema)
    @blp.alt_response(429, description="Too many registration attempts (rate limited).")
    def post(self, data):
        """Create a citizen (USER) account.

        Rate-limited per IP and email (default 5 requests / 60s).
        """
        user = auth_service.register_user(
            name=data["name"],
            email=data["email"],
            password=data["password"],
            phone=data.get("phone"),
            avatar_url=data.get("avatarUrl"),
            location=data.get("location"),
            id_number=data.get("idNumber"),
            preferred_contact_method=data.get("preferredContactMethod") or "PHONE",
        )
        return auth_service.user_to_auth_dict(user)


@blp.route("/login")
class LoginResource(MethodView):
    @rate_limit(scope="login")
    @blp.arguments(LoginSchema)
    @blp.response(200, LoginResponseSchema)
    @blp.alt_response(429, description="Too many login attempts (rate limited).")
    def post(self, data):
        """Exchange email/password for a JWT and AuthUser payload.

        Rate-limited per IP and email (default 10 requests / 60s) to slow
        credential stuffing while remaining demo-friendly in Swagger.
        """
        token, user = auth_service.authenticate(data["email"], data["password"])
        return {
            "accessToken": token,
            "user": auth_service.user_to_auth_dict(user),
        }


@blp.route("/me")
class MeResource(MethodView):
    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, AuthUserSchema)
    def get(self):
        """Return the authenticated user."""
        user = get_current_user()
        return auth_service.user_to_auth_dict(user)

    @jwt_required()
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.arguments(UpdateProfileSchema)
    @blp.response(200, AuthUserSchema)
    def patch(self, data):
        """Update the authenticated user's profile (AccountPage)."""
        user = auth_service.update_profile(get_current_user(), data)
        return auth_service.user_to_auth_dict(user)
