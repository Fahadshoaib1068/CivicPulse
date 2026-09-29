from fastapi import APIRouter, Response
from sqlalchemy import text

from app.db.session import engine

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "alive"}


@router.get("/ready")
def ready(response: Response):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        response.status_code = 503
        return {"status": "not ready", "reason": "database unreachable"}

    return {"status": "ready"}