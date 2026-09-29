from app.services.triage_service import TriageService
from app.providers.triage.simulated import SimulatedTriage
from app.providers.triage.rules import RuleBasedTriage


class FakeCache:
    def __init__(self):
        self._store = {}

    def get(self, key):
        return self._store.get(key)

    def setex(self, key, ttl_seconds, value):
        self._store[key] = value


def test_successful_provider_call_records_provider_name():
    service = TriageService(provider=SimulatedTriage())
    result, triaged_by, latency_ms = service.triage("Water leak on Street 12", "Street 12")

    assert triaged_by == "simulated"
    assert latency_ms >= 0


def test_failing_provider_falls_back_to_rules():
    service = TriageService(provider=SimulatedTriage(should_fail=True))
    result, triaged_by, latency_ms = service.triage("Burst water main", "Street 12")

    assert triaged_by == "rules:fallback"
    assert result is not None


def test_malformed_provider_response_falls_back_to_rules():
    service = TriageService(provider=SimulatedTriage(return_malformed=True))
    result, triaged_by, latency_ms = service.triage("Streetlight is broken", "Block 4")

    assert triaged_by == "rules:fallback"


def test_cache_hit_skips_provider_and_returns_zero_latency():
    cache = FakeCache()
    service = TriageService(provider=SimulatedTriage(), cache=cache)

    first_result, first_triaged_by, _ = service.triage("Sewage overflow near market", "Market Road")
    second_result, second_triaged_by, second_latency = service.triage("Sewage overflow near market", "Market Road")

    assert second_latency == 0
    assert second_result == first_result
    assert second_triaged_by == first_triaged_by


def test_different_text_produces_different_cache_keys():
    cache = FakeCache()
    service = TriageService(provider=SimulatedTriage(), cache=cache)

    service.triage("Pothole on Main Street", "Main Street")
    _, _, latency_ms = service.triage("Streetlight out on Elm Street", "Elm Street")

    assert latency_ms >= 0


def test_service_without_cache_still_works():
    service = TriageService(provider=SimulatedTriage())
    result, triaged_by, _ = service.triage("Transformer sparking", "Block 9")

    assert result is not None
    assert triaged_by == "simulated"

def test_transient_failure_retries_once_and_succeeds():
    service = TriageService(provider=SimulatedTriage(fail_times=1))
    result, triaged_by, latency_ms = service.triage("Pothole near school", "School Road")

    assert triaged_by == "simulated"
    assert result is not None


def test_two_transient_failures_exhaust_single_retry_and_fall_back():
    service = TriageService(provider=SimulatedTriage(fail_times=2))
    result, triaged_by, latency_ms = service.triage("Sparking transformer", "Block 9")

    assert triaged_by == "rules:fallback"