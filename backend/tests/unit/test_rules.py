from app.providers.triage.rules import RuleBasedTriage
from app.providers.triage.base import Category, Priority


def test_water_keyword_maps_to_water_category():
    provider = RuleBasedTriage()
    result = provider.triage("Burst water main flooding Street 12", "Street 12")
    assert result.category == Category.WATER


def test_unmatched_text_falls_back_to_other():
    provider = RuleBasedTriage()
    result = provider.triage("This complaint mentions nothing relevant", "Somewhere")
    assert result.category == Category.OTHER


def test_urgent_keyword_sets_high_priority():
    provider = RuleBasedTriage()
    result = provider.triage("Danger, flooding on the street", "Street 12")
    assert result.priority == Priority.HIGH


def test_non_urgent_text_sets_normal_priority():
    provider = RuleBasedTriage()
    result = provider.triage("Streetlight has been flickering for a week", "Block 4")
    assert result.priority == Priority.NORMAL


def test_summary_is_truncated_to_140_chars():
    provider = RuleBasedTriage()
    long_text = "water leak " * 30
    result = provider.triage(long_text, "Somewhere")
    assert len(result.summary) <= 140


def test_provider_name_matches_triaged_by_convention():
    provider = RuleBasedTriage()
    assert provider.name == "rules"