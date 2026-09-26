import os

from fastapi import APIRouter

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/providers")
def get_providers():
    supported = ["rules", "simulated", "llm", "ollama"]
    current = os.getenv("TRIAGE_PROVIDER", "rules").lower()
    return {
        "providers": supported,
        "current": current,
    }
