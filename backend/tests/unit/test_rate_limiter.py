import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException

from app.middleware.rate_limiter import check_rate_limit, RATE_LIMIT_MAX_REQUESTS


def _make_fake_request(ip="1.2.3.4"):
    request = MagicMock()
    request.client.host = ip
    return request


def test_under_limit_does_not_raise():
    cache = MagicMock()
    cache.client.incr.return_value = 1

    check_rate_limit(_make_fake_request(), cache)


def test_exceeding_limit_raises_429_with_retry_after():
    cache = MagicMock()
    cache.client.incr.return_value = RATE_LIMIT_MAX_REQUESTS + 1
    cache.client.ttl.return_value = 42

    with pytest.raises(HTTPException) as exc_info:
        check_rate_limit(_make_fake_request(), cache)

    assert exc_info.value.status_code == 429
    assert exc_info.value.headers["Retry-After"] == "42"


def test_different_ips_are_tracked_separately():
    cache = MagicMock()
    cache.client.incr.side_effect = [1, 1]

    check_rate_limit(_make_fake_request("1.1.1.1"), cache)
    check_rate_limit(_make_fake_request("2.2.2.2"), cache)

    assert cache.client.incr.call_count == 2