import io
from tests.test_reads import _auth_header
from tests.test_supporting_writes import _seed_supporting


def test_incident_media_upload_flow(client, app):
    ids = _seed_supporting(app)
    admin = _auth_header(client, ids["admin_email"])
    citizen = _auth_header(client, ids["citizen_email"])

    # 1. Upload a valid image as citizen reporter
    file_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    data = {
        "file": (io.BytesIO(file_content), "accident_scene.png", "image/png"),
    }
    resp = client.post(
        f"/api/v1/incidents/{ids['incident_id']}/media/upload",
        headers=citizen,
        data=data,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 201, resp.get_json()
    media_data = resp.get_json()
    assert media_data["kind"] == "image"
    assert media_data["name"] == "accident_scene.png"
    assert media_data["incidentId"] == ids["incident_id"]
    media_id = media_data["id"]

    # 2. Check that media is listed
    listed = client.get(
        f"/api/v1/incidents/{ids['incident_id']}/media",
        headers=admin,
    )
    assert listed.status_code == 200
    ids_in_list = [m["id"] for m in listed.get_json()]
    assert media_id in ids_in_list

    # 2b. Stream uploaded bytes back through authenticated content route
    content_resp = client.get(
        f"/api/v1/incidents/media/{media_id}/content",
        headers=admin,
    )
    assert content_resp.status_code == 200
    assert content_resp.data == file_content

    # 3. Soft-delete the media
    delete_resp = client.delete(
        f"/api/v1/incidents/media/{media_id}",
        headers=admin,
    )
    assert delete_resp.status_code == 204

    # 4. Confirm it no longer appears in the list
    listed_after = client.get(
        f"/api/v1/incidents/{ids['incident_id']}/media",
        headers=admin,
    )
    assert all(m["id"] != media_id for m in listed_after.get_json())


def test_media_upload_validation(client, app):
    ids = _seed_supporting(app)
    admin = _auth_header(client, ids["admin_email"])

    # Missing file
    resp_empty = client.post(
        f"/api/v1/incidents/{ids['incident_id']}/media/upload",
        headers=admin,
        data={},
        content_type="multipart/form-data",
    )
    assert resp_empty.status_code == 422

    # Unsupported MIME type (e.g. text/plain or executable)
    bad_data = {
        "file": (io.BytesIO(b"malicious script"), "script.exe", "application/x-msdownload"),
    }
    resp_bad = client.post(
        f"/api/v1/incidents/{ids['incident_id']}/media/upload",
        headers=admin,
        data=bad_data,
        content_type="multipart/form-data",
    )
    assert resp_bad.status_code == 422
