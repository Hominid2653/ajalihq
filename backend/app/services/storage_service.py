"""Supabase Storage service for incident media uploads."""

from __future__ import annotations

import io
import json
import logging
import os
import re
import urllib.error
import urllib.parse
import urllib.request
import uuid
from typing import Any
from werkzeug.datastructures import FileStorage

from flask import current_app
from flask_smorest import abort

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = frozenset(
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "image/heic",
        "image/heif",
    }
)

ALLOWED_VIDEO_TYPES = frozenset(
    {
        "video/mp4",
        "video/webm",
        "video/quicktime",
    }
)

ALLOWED_MIME_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES
MAX_FILE_BYTES = 15 * 1024 * 1024  # 15 MB


def _sanitize_filename(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]", "_", os.path.basename(name))
    return cleaned[:100] or "attachment"


def _extract_supabase_url_from_db(db_url: str) -> str:
    m = re.search(r"postgres\.([a-zA-Z0-9_-]+):", db_url)
    if m:
        return f"https://{m.group(1)}.supabase.co"
    return ""


def _get_supabase_config() -> tuple[str, str, str]:
    db_uri = str(current_app.config.get("SQLALCHEMY_DATABASE_URI") or "")
    url = (
        current_app.config.get("SUPABASE_URL")
        or os.getenv("SUPABASE_URL")
        or _extract_supabase_url_from_db(db_uri)
    ).strip().rstrip("/")
    key = (
        current_app.config.get("SUPABASE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or ""
    ).strip()
    bucket = (
        current_app.config.get("SUPABASE_STORAGE_BUCKET")
        or os.getenv("SUPABASE_STORAGE_BUCKET")
        or "incident-media"
    ).strip()
    return url, key, bucket


def _ensure_bucket_exists(supabase_url: str, supabase_key: str, bucket: str) -> None:
    """Try to create public bucket if it does not already exist."""
    endpoint = f"{supabase_url}/storage/v1/bucket"
    payload = json.dumps({"id": bucket, "name": bucket, "public": True}).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={
            "Authorization": f"Bearer {supabase_key}",
            "apiKey": supabase_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=8):
            logger.info("Created Supabase storage bucket: %s", bucket)
    except urllib.error.HTTPError as exc:
        if exc.code not in (400, 409):
            logger.warning("Supabase bucket creation check returned %s: %s", exc.code, exc.reason)
    except Exception as exc:
        logger.warning("Could not verify Supabase bucket existence: %s", exc)


def _save_local_fallback_file(
    file_bytes: bytes,
    filename: str,
    incident_id: str,
) -> tuple[str, str]:
    """Save actual uploaded file locally in instance directory for dev/test mode."""
    if os.getenv("PORT") or os.getenv("FLASK_ENV", "").lower() == "production":
        abort(
            503,
            message=(
                "Media storage is not configured for production. "
                "Set SUPABASE_URL and SUPABASE_KEY on the server."
            ),
        )

    safe_name = _sanitize_filename(filename)
    unique_filename = f"{uuid.uuid4().hex[:12]}_{safe_name}"
    uploads_dir = os.path.join(current_app.instance_path, "uploads", incident_id)
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, unique_filename)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    local_url = f"/api/v1/incidents/media/file/{incident_id}/{unique_filename}"
    unique_key = f"local://{incident_id}/{unique_filename}"
    return local_url, unique_key


def upload_to_supabase_storage(
    file_bytes: bytes,
    filename: str,
    mime_type: str,
    incident_id: str,
) -> tuple[str, str]:
    """
    Uploads raw file bytes to Supabase Storage bucket.
    If Supabase key is not provided, saves actual file locally so preview displays immediately.
    Returns (public_url, storage_key).
    """
    supabase_url, supabase_key, bucket = _get_supabase_config()
    safe_name = _sanitize_filename(filename)
    unique_key = f"incidents/{incident_id}/{uuid.uuid4()}-{safe_name}"

    if not supabase_url or not supabase_key:
        logger.info("SUPABASE_KEY not configured; saving actual uploaded file locally for preview.")
        return _save_local_fallback_file(file_bytes, filename, incident_id)

    upload_endpoint = f"{supabase_url}/storage/v1/object/{bucket}/{unique_key}"
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apiKey": supabase_key,
        "Content-Type": mime_type,
        "x-upsert": "true",
    }

    req = urllib.request.Request(
        upload_endpoint,
        data=file_bytes,
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status not in (200, 201):
                logger.warning("Supabase upload returned non-200: %s", resp.status)
    except urllib.error.HTTPError as err:
        if err.code in (400, 404):
            _ensure_bucket_exists(supabase_url, supabase_key, bucket)
            retry_req = urllib.request.Request(
                upload_endpoint,
                data=file_bytes,
                headers=headers,
                method="POST",
            )
            try:
                with urllib.request.urlopen(retry_req, timeout=15):
                    pass
            except Exception as retry_err:
                logger.error("Supabase storage upload failed on retry: %s", retry_err)
                return _save_local_fallback_file(file_bytes, filename, incident_id)
        else:
            err_body = err.read().decode("utf-8", errors="replace")
            logger.error("Supabase storage error %s: %s", err.code, err_body)
            return _save_local_fallback_file(file_bytes, filename, incident_id)
    except Exception as exc:
        logger.error("Supabase storage network error: %s", exc)
        return _save_local_fallback_file(file_bytes, filename, incident_id)

    public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{unique_key}"
    return public_url, unique_key


def fetch_stored_media_bytes(storage_key: str, url: str) -> tuple[bytes, str]:
    """Load bytes for a stored media object from local disk or Supabase."""
    supabase_url, supabase_key, bucket = _get_supabase_config()

    if storage_key.startswith("local://"):
        relative = storage_key.removeprefix("local://")
        incident_id, filename = relative.split("/", 1)
        uploads_dir = os.path.join(current_app.instance_path, "uploads", incident_id)
        file_path = os.path.join(uploads_dir, filename)
        if not os.path.isfile(file_path):
            abort(404, message="Media file not found on server.")
        with open(file_path, "rb") as handle:
            return handle.read(), "application/octet-stream"

    object_key = storage_key
    if not object_key and url and "supabase.co/storage/v1/object/" in url:
        marker = f"/object/public/{bucket}/"
        if marker in url:
            object_key = url.split(marker, 1)[1]
        else:
            parts = url.split("/object/", 1)
            if len(parts) == 2:
                object_key = parts[1].split("/", 1)[-1]

    if object_key and supabase_url and supabase_key:
        encoded = "/".join(urllib.parse.quote(part) for part in object_key.split("/"))
        fetch_url = f"{supabase_url}/storage/v1/object/{bucket}/{encoded}"
        req = urllib.request.Request(
            fetch_url,
            headers={
                "Authorization": f"Bearer {supabase_key}",
                "apiKey": supabase_key,
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                body = resp.read()
                mime = resp.headers.get("Content-Type") or "application/octet-stream"
                return body, mime
        except urllib.error.HTTPError as err:
            if err.code == 404:
                abort(404, message="Media file not found in storage.")
            abort(502, message="Could not fetch media from storage.")

    if url.startswith("http://") or url.startswith("https://"):
        try:
            with urllib.request.urlopen(url, timeout=20) as resp:
                body = resp.read()
                mime = resp.headers.get("Content-Type") or "application/octet-stream"
                return body, mime
        except Exception as exc:
            logger.error("Could not fetch media URL %s: %s", url, exc)
            abort(404, message="Media file is unavailable.")

    abort(404, message="Media file is unavailable.")


def process_media_upload(
    file_storage: FileStorage,
    incident_id: str,
) -> dict[str, Any]:
    """Validates and processes a file upload for an incident."""
    if not file_storage or not file_storage.filename:
        abort(422, message="No file provided.")

    filename = file_storage.filename
    mime_type = (file_storage.mimetype or "application/octet-stream").lower()

    if mime_type not in ALLOWED_MIME_TYPES:
        abort(
            422,
            message=(
                f"Unsupported file type '{mime_type}'. "
                f"Allowed formats: JPEG, PNG, WebP, GIF, MP4, WebM, QuickTime."
            ),
        )

    file_bytes = file_storage.read()
    byte_size = len(file_bytes)

    if byte_size == 0:
        abort(422, message="Uploaded file is empty.")

    if byte_size > MAX_FILE_BYTES:
        max_mb = MAX_FILE_BYTES // (1024 * 1024)
        abort(422, message=f"File exceeds maximum allowed size of {max_mb} MB.")

    kind = "video" if mime_type in ALLOWED_VIDEO_TYPES else "image"
    public_url, storage_key = upload_to_supabase_storage(
        file_bytes=file_bytes,
        filename=filename,
        mime_type=mime_type,
        incident_id=incident_id,
    )

    return {
        "url": public_url,
        "storage_key": storage_key,
        "name": filename,
        "kind": kind,
        "mime_type": mime_type,
        "byte_size": byte_size,
    }
