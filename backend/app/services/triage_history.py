from collections import deque

MAX_HISTORY = 20

_history: deque = deque(maxlen=MAX_HISTORY)


def record_outcome(provider: str, latency_ms: int, was_fallback: bool) -> None:
    _history.appendleft({
        "provider": provider,
        "latency_ms": latency_ms,
        "fallback": was_fallback,
    })


def get_recent_outcomes() -> list[dict]:
    return list(_history)