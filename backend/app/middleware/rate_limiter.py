import time

from fastapi import HTTPException, Request

from app.providers.cache.redis_cache import RedisCache

RATE_LIMIT_MAX_REQUESTS = 10
RATE_LIMIT_WINDOW_SECONDS = 60


def check_rate_limit(request: Request, cache: RedisCache) -> None:
    client_ip = request.client.host if request.client else "unknown"
    window = int(time.time() // RATE_LIMIT_WINDOW_SECONDS)
    key = f"ratelimit:{client_ip}:{window}"

    current = cache.client.incr(key)
    if current == 1:
        cache.client.expire(key, RATE_LIMIT_WINDOW_SECONDS)

    if current > RATE_LIMIT_MAX_REQUESTS:
        ttl = cache.client.ttl(key)
        retry_after = ttl if ttl > 0 else RATE_LIMIT_WINDOW_SECONDS
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(retry_after)},
        )