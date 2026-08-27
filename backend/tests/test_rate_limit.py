from app.middleware.rate_limit import reset_rate_limit_state


def test_login_rate_limit_returns_429(client, app):
    app.config["RATE_LIMIT_ENABLED"] = True
    app.config["AUTH_LOGIN_RATE_LIMIT"] = 3
    app.config["AUTH_LOGIN_RATE_WINDOW_SECONDS"] = 60
    reset_rate_limit_state()

    payload = {"email": "nobody@example.com", "password": "wrong"}
    for _ in range(3):
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401

    limited = client.post("/api/v1/auth/login", json=payload)
    assert limited.status_code == 429
    body = limited.get_json()
    assert body["code"] == 429
    assert "Too many" in body["message"]
    assert limited.headers.get("Retry-After")
    assert int(limited.headers["Retry-After"]) >= 1


def test_register_rate_limit_returns_429(client, app):
    app.config["RATE_LIMIT_ENABLED"] = True
    app.config["AUTH_REGISTER_RATE_LIMIT"] = 2
    app.config["AUTH_REGISTER_RATE_WINDOW_SECONDS"] = 60
    reset_rate_limit_state()

    def register(email: str):
        return client.post(
            "/api/v1/auth/register",
            json={
                "name": "Rate Limit Citizen",
                "email": email,
                "password": "password123",
                "phone": "+254700000010",
            },
        )

    assert register("rl1@example.com").status_code == 201
    assert register("rl2@example.com").status_code == 201
    limited = register("rl3@example.com")
    assert limited.status_code == 429
    assert limited.headers.get("Retry-After")
