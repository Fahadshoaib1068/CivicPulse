import hashlib

from .base import Category, Priority, TriageResult, TriageProvider


class SimulatedTriage:
    name = "simulated"

    def __init__(self, should_fail: bool = False, return_malformed: bool = False, fail_times: int = 0):
        self.should_fail = should_fail
        self.return_malformed = return_malformed
        self.fail_times = fail_times
        self._call_count = 0

    def triage(self, text: str, location: str) -> TriageResult:
        self._call_count += 1

        if self.should_fail:
            raise RuntimeError("Simulated provider failure")

        if self.return_malformed:
            raise ValueError("Simulated malformed response from provider")

        if self._call_count <= self.fail_times:
            raise TimeoutError("Simulated transient timeout")

        seed = int(hashlib.md5(text.encode()).hexdigest(), 16)
        categories = list(Category)
        priorities = list(Priority)

        return TriageResult(
            category=categories[seed % len(categories)],
            priority=priorities[seed % len(priorities)],
            summary=text.strip()[:140],
            confidence=0.9,
        )