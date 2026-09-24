import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.db.models import Complaint
from app.models.enums import Category, Priority, Status


class ComplaintRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        text: str,
        location: str,
        category: Category,
        priority: Priority,
        ai_summary: str | None,
        triaged_by: str,
        triage_latency_ms: int,
        reporter_contact: str | None = None,
    ) -> Complaint:
        complaint = Complaint(
            text=text,
            location=location,
            reporter_contact=reporter_contact,
            category=category,
            priority=priority,
            status=Status.OPEN,
            ai_summary=ai_summary,
            triaged_by=triaged_by,
            triage_latency_ms=triage_latency_ms,
        )
        self.db.add(complaint)
        self.db.commit()
        self.db.refresh(complaint)
        return complaint

    def get_by_id(self, complaint_id: uuid.UUID) -> Complaint | None:
        return self.db.get(Complaint, complaint_id)

    def list_filtered(
        self,
        category: Category | None = None,
        priority: Priority | None = None,
        status: Status | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Complaint], int]:
        query = select(Complaint)

        if category is not None:
            query = query.where(Complaint.category == category)
        if priority is not None:
            query = query.where(Complaint.priority == priority)
        if status is not None:
            query = query.where(Complaint.status == status)

        total = self.db.scalar(select(func.count()).select_from(query.subquery()))

        query = query.order_by(Complaint.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        results = self.db.scalars(query).all()

        return list(results), total or 0

    def update_status(self, complaint_id: uuid.UUID, new_status: Status) -> Complaint | None:
        complaint = self.get_by_id(complaint_id)
        if complaint is None:
            return None
        complaint.status = new_status
        complaint.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(complaint)
        return complaint

    def get_stats(self) -> dict:
        category_counts = dict(
            self.db.execute(
                select(Complaint.category, func.count()).group_by(Complaint.category)
            ).all()
        )
        priority_counts = dict(
            self.db.execute(
                select(Complaint.priority, func.count()).group_by(Complaint.priority)
            ).all()
        )
        return {"by_category": category_counts, "by_priority": priority_counts}