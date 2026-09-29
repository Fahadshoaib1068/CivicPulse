from fastapi import APIRouter, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

router = APIRouter(tags=["metrics"])

REQUEST_COUNT = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "path", "status_code"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds", "HTTP request latency", ["method", "path"]
)
TRIAGE_LATENCY = Histogram(
    "triage_duration_seconds", "Triage call latency", ["provider"]
)
TRIAGE_FALLBACK_COUNT = Counter(
    "triage_fallback_total", "Number of times triage fell back to rules"
)


@router.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)