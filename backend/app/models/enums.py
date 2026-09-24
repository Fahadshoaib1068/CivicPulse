import enum

from app.providers.triage.base import Category, Priority


class Status(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"


__all__ = ["Category", "Priority", "Status"]