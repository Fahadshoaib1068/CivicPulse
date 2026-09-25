import uuid

from sqlalchemy.orm import Session

from app.db.models import Complaint
from app.models.enums import Status
from app.repositories.complaint_repository import ComplaintRepository
from app.services.triage_service import TriageService


class InvalidTransitionError(Exception):
    def __init__(self, from_status: Status, to_status: Status):
        self.from_status = from_status
        self.to_status = to_status
        super().__init__(f"Cannot transition from {from_status.value} to {to_status.value}")


class ComplaintNotFoundError(Exception):
    pass


VALID_TRANSITIONS: dict[Status, set[Status]] = {
    Status.OPEN: {Status.IN_PROGRESS, Status.REJECTED},
    Status.IN_PROGRESS: {Status.RESOLVED, Status.REJECTED},
    Status.RESOLVED: set(),
    Status.REJECTED: set(),
}


class ComplaintService:
    def __init__(self, db: Session, triage_service: TriageService):
        self.repo = ComplaintRepository(db)
        self.triage_service = triage_service

    def submit_complaint(
        self, text: str, location: str, reporter_contact: str | None = None
    ) -> Complaint:
        result, triaged_by, latency_ms = self.triage_service.triage(text, location)

        return self.repo.create(
            text=text,
            location=location,
            reporter_contact=reporter_contact,
            category=result.category,
            priority=result.priority,
            ai_summary=result.summary,
            triaged_by=triaged_by,
            triage_latency_ms=latency_ms,
        )

    def get_complaint(self, complaint_id: uuid.UUID) -> Complaint | None:
        return self.repo.get_by_id(complaint_id)

    def list_complaints(self, **filters) -> tuple[list[Complaint], int]:
        return self.repo.list_filtered(**filters)

    def transition_status(self, complaint_id: uuid.UUID, new_status: Status) -> Complaint:
        complaint = self.repo.get_by_id(complaint_id)
        if complaint is None:
            raise ComplaintNotFoundError(f"Complaint {complaint_id} not found")

        current_status = complaint.status
        allowed = VALID_TRANSITIONS.get(current_status, set())

        if new_status not in allowed:
            raise InvalidTransitionError(current_status, new_status)

        return self.repo.update_status(complaint_id, new_status)