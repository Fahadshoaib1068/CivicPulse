import hashlib
import json
import logging
import random
import time
from typing import Optional, Protocol

from app.providers.triage.base import TriageProvider, TriageResult
from app.providers.triage.rules import RuleBasedTriage

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 24 * 60 * 60


class CacheClient(Protocol):
    def get(self, key: str) -> Optional[str]: ...
    def setex(self, key: str, ttl_seconds: int, value: str) -> None: ...


class TriageService:
    def __init__(self, provider: TriageProvider, cache: Optional[CacheClient] = None):
        self.provider = provider
        self.fallback = RuleBasedTriage()
        self.cache = cache

    def triage(self, text: str, location: str) -> tuple[TriageResult, str, int]:
        cache_key = self._cache_key(text)

        if self.cache is not None:
            cached = self.cache.get(cache_key)
            if cached is not None:
                data = json.loads(cached)
                return TriageResult(**data["result"]), data["triaged_by"], 0

        start = time.monotonic()
        try:
            result = self._call_with_retry(text, location)
            triaged_by = self.provider.name
        except Exception as exc:
            logger.warning(
                "triage fallback triggered",
                extra={"provider": self.provider.name, "error_class": type(exc).__name__},
            )
            result = self.fallback.triage(text, location)
            triaged_by = "rules:fallback"

        latency_ms = int((time.monotonic() - start) * 1000)

        if self.cache is not None:
            self.cache.setex(
                cache_key,
                CACHE_TTL_SECONDS,
                json.dumps({"result": result.model_dump(), "triaged_by": triaged_by}),
            )

        return result, triaged_by, latency_ms

    def _call_with_retry(self, text: str, location: str) -> TriageResult:
        try:
            return self.provider.triage(text, location)
        except self._retryable_errors():
            time.sleep(0.1 + random.uniform(0, 0.2))
            return self.provider.triage(text, location)

    def _retryable_errors(self) -> tuple:
        errors = (TimeoutError, ConnectionError)
        try:
            import groq
            errors += (groq.APITimeoutError, groq.RateLimitError, groq.InternalServerError)
        except ImportError:
            pass
        return errors

    @staticmethod
    def _cache_key(text: str) -> str:
        return f"triage:{hashlib.sha256(text.encode()).hexdigest()}"