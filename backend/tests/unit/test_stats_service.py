import json
from unittest.mock import MagicMock

from app.services.stats_service import StatsService


def _make_service_with_fakes():
    service = StatsService.__new__(StatsService)
    service.repo = MagicMock()
    service.cache = MagicMock()
    return service


def test_cache_miss_calls_repo_and_stores_result():
    service = _make_service_with_fakes()
    service.cache.get.return_value = None
    service.repo.get_stats.return_value = {"by_category": {"water": 5}, "by_priority": {"high": 3}}

    stats, was_hit = service.get_stats()

    assert was_hit is False
    assert stats["by_category"]["water"] == 5
    service.cache.setex.assert_called_once()


def test_cache_hit_skips_repo():
    service = _make_service_with_fakes()
    cached_data = json.dumps({"by_category": {"water": 5}, "by_priority": {"high": 3}})
    service.cache.get.return_value = cached_data

    stats, was_hit = service.get_stats()

    assert was_hit is True
    service.repo.get_stats.assert_not_called()


def test_invalidate_deletes_cache_key():
    service = _make_service_with_fakes()

    service.invalidate()

    service.cache.client.delete.assert_called_once_with("stats:aggregate")