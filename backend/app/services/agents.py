"""Agent integration."""

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from app import models
from app.config import get_settings
from app.schemas.tasks import TaskAI

settings = get_settings()

_model = OpenAIChat(id=settings.OPENAI_MODEL, api_key=settings.OPENAI_API_KEY)
_analyzer_agent = Agent(
    model=_model,
    description="You are an analytical assistant. Provide concise, structured analysis of a task.",
    instructions=[
        "Clarify objectives",
        "Identify constraints and risks",
        "Outline steps and dependencies",
        "Suggest metrics of success",
    ],
)

_assistant_agent = Agent(
    model=_model,
    description="You are a productivity assistant. Help the user move the task forward.",
    instructions=[
        "Propose next best actions",
        "Draft checklists and timelines",
        "Unblock with concrete suggestions and templates",
        "Keep it brief and actionable",
    ],
)


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
        result = _analyzer_agent.run(TaskAI.from_db(task))
        return result.content or "No suggestions at this time."


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
        result = _assistant_agent.run(TaskAI.from_db(task))
        return result.content or "No suggestions at this time."
