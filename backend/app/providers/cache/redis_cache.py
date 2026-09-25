import redis

from app.config import settings


class RedisCache:
    def __init__(self):
        self.client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

    def get(self, key: str) -> str | None:
        return self.client.get(key)

    def setex(self, key: str, ttl_seconds: int, value: str) -> None:
        self.client.setex(key, ttl_seconds, value)