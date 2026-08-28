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
from app.schemas.openapi_examples import (
    HINT_AUTH,
    LOGIN_ADMIN,
    REGISTER_CITIZEN,
    UPDATE_PROFILE,
)
from app.services import auth_service

blp = Blueprint(
    "Auth",
    "auth",
    url_prefix="/api/v1/auth",
    description=(
        "Citizen and admin authentication (JWT). "
        f"{HINT_AUTH} "
        "Seeded demos: brian@ajalihq.test (ADMIN) and amina@ajalihq.test (USER), password `password`."
    ),
)


@blp.route("/register")
class RegisterResource(MethodView):
    @blp.doc(
        description=(
            "Creates a **USER** (citizen) account. Admins are seeded, not registered here. "
            "Password min length 6. Duplicate email → **409**."
        )
    )
    @blp.arguments(RegisterSchema, example=REGISTER_CITIZEN)
    @blp.response(201, AuthUserSchema)
    @rate_limit(limit=10, window_seconds=60)
    def post(self, data):
        """Create a citizen (USER) account."""
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
    @blp.doc(
        description=(
            "**Start here in Swagger.** Execute with the demo body, copy `accessToken`, "
            "click **Authorize** (top), paste token into BearerAuth. "
            "Wrong password → **401**. Rate-limited."
        )
    )
    @blp.arguments(LoginSchema, example=LOGIN_ADMIN)
    @blp.response(200, LoginResponseSchema)
    @rate_limit(limit=20, window_seconds=60)
    def post(self, data):
        """Exchange email/password for a JWT and AuthUser payload."""
        token, user = auth_service.authenticate(data["email"], data["password"])
        return {
            "accessToken": token,
            "user": auth_service.user_to_auth_dict(user),
        }


@blp.route("/me")
class MeResource(MethodView):
    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description="Returns the user for the current JWT. Use after Authorize to confirm the token works.",
    )
    @blp.response(200, AuthUserSchema)
    def get(self):
        """Return the authenticated user."""
        user = get_current_user()
        return auth_service.user_to_auth_dict(user)

    @jwt_required()
    @blp.doc(
        security=[{"BearerAuth": []}],
        description="Partial profile update (AccountPage). Only send fields you want to change.",
    )
    @blp.arguments(UpdateProfileSchema, example=UPDATE_PROFILE)
    @blp.response(200, AuthUserSchema)
    def patch(self, data):
        """Update the authenticated user's profile (AccountPage)."""
        user = auth_service.update_profile(get_current_user(), data)
        return auth_service.user_to_auth_dict(user)
