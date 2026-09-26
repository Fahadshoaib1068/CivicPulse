import os

from fastapi import APIRouter

from app.services.triage_history import get_recent_outcomes

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/providers")
def get_providers():
    supported = ["rules", "simulated", "llm", "ollama"]
    current = os.getenv("TRIAGE_PROVIDER", "rules").lower()
    return {
        "providers": supported,
        "current": current,
        "recent_outcomes": get_recent_outcomes(),
    }