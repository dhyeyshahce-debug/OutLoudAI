from typing import Any
from pydantic import BaseModel, Field


class StudentAnswer(BaseModel):
    time_complexity: str
    space_complexity: str | None = None
    explanation: str = ""


class Track1Input(BaseModel):
    problem_id: str
    scores: dict[str, float] = Field(default_factory=dict)
    student_answer: StudentAnswer
    expected_time_complexity: str | None = None
    expected_space_complexity: str | None = None
    rubric: dict[str, Any] | None = None
    session_id: str | None = None


class ComplexityCheck(BaseModel):
    stated_time: str
    expected_time: str | None
    matches: bool
    sanity_passed: bool
    reason: str


class Feedback(BaseModel):
    strengths: list[str]
    weaknesses: list[str]
    progressive_hints: list[str]


class EvaluationOutput(BaseModel):
    complexity_check: ComplexityCheck
    feedback: Feedback
