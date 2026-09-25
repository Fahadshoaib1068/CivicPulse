import json

from sqlalchemy.orm import Session

from app.providers.cache.redis_cache import RedisCache
from app.repositories.complaint_repository import ComplaintRepository

STATS_CACHE_KEY = "stats:aggregate"
STATS_CACHE_TTL_SECONDS = 30


class StatsService:
    def __init__(self, db: Session, cache: RedisCache):
        self.repo = ComplaintRepository(db)
        self.cache = cache

    def get_stats(self) -> tuple[dict, bool]:
        cached = self.cache.get(STATS_CACHE_KEY)
        if cached is not None:
            return json.loads(cached), True

        stats = self.repo.get_stats()
        self.cache.setex(STATS_CACHE_KEY, STATS_CACHE_TTL_SECONDS, json.dumps(stats))
        return stats, False

    def invalidate(self) -> None:
        self.cache.client.delete(STATS_CACHE_KEY)