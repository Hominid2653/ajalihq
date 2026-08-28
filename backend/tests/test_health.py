from app import create_app


def test_health_ok():
    client = create_app("testing").test_client()
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["status"] == "ok"
    assert payload["service"] == "ajali-api"


def test_root_points_to_docs():
    client = create_app("testing").test_client()
    response = client.get("/")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["docs"] == "/docs"
    assert payload["health"] == "/api/v1/health"


def test_openapi_spec_available():
    client = create_app("testing").test_client()
    response = client.get("/openapi.json")

    assert response.status_code == 200
    spec = response.get_json()
    assert spec["info"]["title"] == "Ajali! API"
    assert "/api/v1/health" in spec["paths"]
    assert "BearerAuth" in spec["components"]["securitySchemes"]
