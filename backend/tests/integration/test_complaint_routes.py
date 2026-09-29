import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.enums import Category, Priority, Status
from app.routes.complaints import get_complaint_service
from app.services.complaint_service import ComplaintNotFoundError, InvalidTransitionError

client = TestClient(app)


def _fake_complaint(**overrides):
    defaults = dict(
        id=uuid.uuid4(),
        text="Burst water main flooding the street",
        location="Street 12",
        reporter_contact=None,
        category=Category.WATER,
        priority=Priority.HIGH,
        status=Status.OPEN,
        ai_summary="Burst water main flooding the street",
        triaged_by="rules:fallback",
        triage_latency_ms=5,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    defaults.update(overrides)
    return MagicMock(**defaults)


def _override_service(fake_service):
    app.dependency_overrides[get_complaint_service] = lambda: fake_service
    yield
    app.dependency_overrides.pop(get_complaint_service, None)


@pytest.fixture
def fake_service():
    service = MagicMock()
    yield service
    app.dependency_overrides.pop(get_complaint_service, None)


def test_create_complaint_returns_201(fake_service):
    fake_service.submit_complaint.return_value = _fake_complaint()
    app.dependency_overrides[get_complaint_service] = lambda: fake_service

    response = client.post(
        "/api/complaints",
        json={"text": "Burst water main flooding the street", "location": "Street 12"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["category"] == "water"
    assert body["status"] == "open"


def test_create_complaint_with_fallback_still_returns_201(fake_service):
    fake_service.submit_complaint.return_value = _fake_complaint(triaged_by="rules:fallback")
    app.dependency_overrides[get_complaint_service] = lambda: fake_service

    response = client.post(
        "/api/complaints",
        json={"text": "Some complaint text long enough", "location": "Somewhere"},
    )

    assert response.status_code == 201
    assert response.json()["triaged_by"] == "rules:fallback"


def test_create_complaint_rejects_short_text(fake_service):
    app.dependency_overrides[get_complaint_service] = lambda: fake_service

    response = client.post(
        "/api/complaints",
        json={"text": "short", "location": "Somewhere"},
    )

    assert response.status_code == 422


def test_get_nonexistent_complaint_returns_404(fake_service):
    fake_service.get_complaint.return_value = None
    app.dependency_overrides[get_complaint_service] = lambda: fake_service

    response = client.get(f"/api/complaints/{uuid.uuid4()}")

    assert response.status_code == 404


def test_invalid_status_transition_returns_409_with_message(fake_service):
    fake_service.transition_status.side_effect = InvalidTransitionError(
        Status.OPEN, Status.RESOLVED
    )
    app.dependency_overrides[get_complaint_service] = lambda: fake_service

    response = client.patch(
        f"/api/complaints/{uuid.uuid4()}/status", json={"status": "resolved"}
    )

    assert response.status_code == 409
    assert "open" in response.json()["detail"]
    assert "resolved" in response.json()["detail"]


def test_status_transition_on_missing_complaint_returns_404(fake_service):
    fake_service.transition_status.side_effect = ComplaintNotFoundError("not found")
    app.dependency_overrides[get_complaint_service] = lambda: fake_service

    response = client.patch(
        f"/api/complaints/{uuid.uuid4()}/status", json={"status": "in_progress"}
    )

    assert response.status_code == 404


def test_list_complaints_returns_paginated_shape(fake_service):
    fake_service.list_complaints.return_value = ([_fake_complaint()], 1)
    app.dependency_overrides[get_complaint_service] = lambda: fake_service

    response = client.get("/api/complaints")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["page"] == 1
    assert len(body["items"]) == 1


def test_health_endpoint_does_not_touch_database():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}