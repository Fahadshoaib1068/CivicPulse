from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.providers.cache.redis_cache import RedisCache
from app.services.stats_service import StatsService

router = APIRouter(prefix="/api", tags=["stats"])


def get_stats_service(db: Session = Depends(get_db)) -> StatsService:
    cache = RedisCache()
    return StatsService(db=db, cache=cache)


@router.get("/stats")
def get_stats(response: Response, service: StatsService = Depends(get_stats_service)):
    stats, was_cache_hit = service.get_stats()
    response.headers["X-Cache"] = "HIT" if was_cache_hit else "MISS"
    return stats