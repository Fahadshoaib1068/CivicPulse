import os

from .base import TriageProvider
from .rules import RuleBasedTriage
from .simulated import SimulatedTriage


def get_triage_provider() -> TriageProvider:
    provider_name = os.getenv("TRIAGE_PROVIDER", "rules").lower()

    if provider_name == "rules":
        return RuleBasedTriage()

    if provider_name == "simulated":
        return SimulatedTriage()

    if provider_name == "llm":
        from .llm import LLMTriage
        return LLMTriage()

    if provider_name == "ollama":
        from .ollama import OllamaTriage
        return OllamaTriage()

    raise ValueError(f"Unknown TRIAGE_PROVIDER: {provider_name}")