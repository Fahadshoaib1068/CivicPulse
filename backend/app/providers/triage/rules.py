from .base import Category, Priority, TriageResult, TriageProvider


class RuleBasedTriage:
    name = "rules"

    _CATEGORY_KEYWORDS: dict[Category, list[str]] = {
        Category.WATER: ["water", "leak", "flood", "pipe", "burst main"],
        Category.ELECTRICITY: ["electric", "power", "wire", "transformer", "outage"],
        Category.SANITATION: ["garbage", "trash", "sewage", "waste"],
        Category.ROADS: ["road", "pothole", "street damage", "asphalt"],
        Category.STREETLIGHTS: ["streetlight", "street light", "lamp post"],
    }

    _HIGH_PRIORITY_KEYWORDS = ["flood", "fire", "urgent", "danger", "collapsed", "burst", "gas leak"]

    def triage(self, text: str, location: str) -> TriageResult:
        lowered = text.lower()

        category = Category.OTHER
        for candidate, keywords in self._CATEGORY_KEYWORDS.items():
            if any(keyword in lowered for keyword in keywords):
                category = candidate
                break

        is_urgent = any(keyword in lowered for keyword in self._HIGH_PRIORITY_KEYWORDS)
        priority = Priority.HIGH if is_urgent else Priority.NORMAL

        return TriageResult(
            category=category,
            priority=priority,
            summary=text.strip()[:140],
            confidence=0.5,
        )