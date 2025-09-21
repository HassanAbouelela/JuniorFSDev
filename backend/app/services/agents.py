"""Agent integration."""

from app import models
from app.config import get_settings

settings = get_settings()


def analyze_task(task: models.Task) -> str:
    if settings.MOCK_AGENTS:
        # Simple heuristic for complexity and deadline suggestion
        length = len(task.description.split())
        if length > 200:
            complexity = "High"
            days = 14
        elif length > 80:
            complexity = "Medium"
            days = 7
        else:
            complexity = "Low"
            days = 3
        return (
            f"Analysis: complexity={complexity}; suggested_deadline_in_days={days}; "
            f"recommended_priority={task.priority.value}"
        )
    else:
        raise NotImplementedError()


def assist_productivity(task: models.Task) -> str:
    if settings.MOCK_AGENTS:
        # Provide a basic breakdown and tips
        tips = [
            "Clarify acceptance criteria",
            "Split into small subtasks",
            "Estimate each subtask",
            "Block calendar time",
            "Review progress daily",
        ]
        return "Breakdown: [Research, Implement, Test, Review]. " f"Tips: {', '.join(tips)}"
    else:
        raise NotImplementedError()
