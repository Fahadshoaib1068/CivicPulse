import pytest
from unittest.mock import MagicMock

from app.services.complaint_service import ComplaintService, InvalidTransitionError
from app.models.enums import Status


def _make_service_with_fake_repo():
    service = ComplaintService.__new__(ComplaintService)
    service.repo = MagicMock()
    return service


def test_open_to_in_progress_is_valid():
    service = _make_service_with_fake_repo()
    fake_complaint = MagicMock(status=Status.OPEN)
    service.repo.get_by_id.return_value = fake_complaint
    service.repo.update_status.return_value = fake_complaint

    service.transition_status(complaint_id="fake-id", new_status=Status.IN_PROGRESS)

    service.repo.update_status.assert_called_once_with("fake-id", Status.IN_PROGRESS)


def test_open_to_resolved_is_invalid():
    service = _make_service_with_fake_repo()
    fake_complaint = MagicMock(status=Status.OPEN)
    service.repo.get_by_id.return_value = fake_complaint

    with pytest.raises(InvalidTransitionError) as exc_info:
        service.transition_status(complaint_id="fake-id", new_status=Status.RESOLVED)

    assert exc_info.value.from_status == Status.OPEN
    assert exc_info.value.to_status == Status.RESOLVED


def test_resolved_is_terminal():
    service = _make_service_with_fake_repo()
    fake_complaint = MagicMock(status=Status.RESOLVED)
    service.repo.get_by_id.return_value = fake_complaint

    with pytest.raises(InvalidTransitionError):
        service.transition_status(complaint_id="fake-id", new_status=Status.IN_PROGRESS)


def test_rejected_is_terminal():
    service = _make_service_with_fake_repo()
    fake_complaint = MagicMock(status=Status.REJECTED)
    service.repo.get_by_id.return_value = fake_complaint

    with pytest.raises(InvalidTransitionError):
        service.transition_status(complaint_id="fake-id", new_status=Status.OPEN)


def test_in_progress_to_rejected_is_valid():
    service = _make_service_with_fake_repo()
    fake_complaint = MagicMock(status=Status.IN_PROGRESS)
    service.repo.get_by_id.return_value = fake_complaint
    service.repo.update_status.return_value = fake_complaint

    service.transition_status(complaint_id="fake-id", new_status=Status.REJECTED)

    service.repo.update_status.assert_called_once_with("fake-id", Status.REJECTED)


def test_nonexistent_complaint_raises_value_error():
    service = _make_service_with_fake_repo()
    service.repo.get_by_id.return_value = None

    with pytest.raises(ValueError):
        service.transition_status(complaint_id="fake-id", new_status=Status.RESOLVED)