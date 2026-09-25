import uuid
from app.services.stats_service import StatsService
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.middleware.rate_limiter import check_rate_limit
from app.db.session import get_db
from app.models.enums import Category, Priority, Status
from app.models.schemas import (
    ComplaintCreateRequest,
    ComplaintListResponse,
    ComplaintResponse,
    StatusUpdateRequest,
)
from app.providers.cache.redis_cache import RedisCache
from app.providers.triage.factory import get_triage_provider
from app.services.complaint_service import (
    ComplaintNotFoundError,
    ComplaintService,
    InvalidTransitionError,
)
from app.services.triage_service import TriageService

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


def get_complaint_service(db: Session = Depends(get_db)) -> ComplaintService:
    provider = get_triage_provider()
    cache = RedisCache()
    triage_service = TriageService(provider=provider, cache=cache)
    return ComplaintService(db=db, triage_service=triage_service)


@router.post("", response_model=ComplaintResponse, status_code=201)
def create_complaint(
    request: Request,
    payload: ComplaintCreateRequest,
    db: Session = Depends(get_db),
    service: ComplaintService = Depends(get_complaint_service),
):
    cache = RedisCache()
    check_rate_limit(request, cache)

    complaint = service.submit_complaint(
        text=payload.text,
        location=payload.location,
        reporter_contact=payload.reporter_contact,
    )

    StatsService(db=db, cache=cache).invalidate()

    return complaint


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: uuid.UUID,
    service: ComplaintService = Depends(get_complaint_service),
):
    complaint = service.get_complaint(complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    category: Category | None = None,
    priority: Priority | None = None,
    status: Status | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service: ComplaintService = Depends(get_complaint_service),
):
    items, total = service.list_complaints(
        category=category, priority=priority, status=status, page=page, page_size=page_size
    )
    return ComplaintListResponse(items=items, total=total, page=page, page_size=page_size)


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_status(
    complaint_id: uuid.UUID,
    payload: StatusUpdateRequest,
    service: ComplaintService = Depends(get_complaint_service),
):
    try:
        return service.transition_status(complaint_id, payload.status)
    except InvalidTransitionError as exc:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot transition from {exc.from_status.value} to {exc.to_status.value}",
        )
    except ComplaintNotFoundError:
        raise HTTPException(status_code=404, detail="Complaint not found")