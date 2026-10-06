from typing import Any

from .complexity import complexity_check
from .feedback import GeminiFeedbackService
from .schemas import (
    ComplexityCheck,
    EvaluationOutput,
    Track1Input,
)


def _expected_complexity_from_problem(
    problem_id: str,
) -> str | None:

    try:
        from sqlmodel import Session, select
        from .database import Problem, engine
    except Exception:
        return None

    try:
        with Session(engine) as session:
            problem = session.exec(
                select(Problem).where(
                    Problem.id == problem_id
                )
            ).first()

            if not problem or not problem.rubric:
                return None

            approaches = problem.rubric.get(
                "approaches",
                [],
            )

            optimal = next(
                (
                    approach
                    for approach in approaches
                    if approach.get("is_optimal") is True
                ),
                None,
            )

            if optimal:
                return optimal.get("expected_time")

    except Exception:
        return None

    return None


def evaluate_track1(
    data: Track1Input,
) -> EvaluationOutput:

    # Use complexity supplied by Track 1 first.
    # Database is only a fallback.
    expected_time = (
        data.expected_time_complexity
        or _expected_complexity_from_problem(
            data.problem_id
        )
    )

    # complexity_check() currently returns a dict.
    # Convert it into our Pydantic model.
    check = ComplexityCheck(
        **complexity_check(
            stated=data.student_answer.time_complexity,
            expected=expected_time,
            explanation=data.student_answer.explanation,
        )
    )

    feedback = GeminiFeedbackService().generate_feedback(
        problem_id=data.problem_id,
        student_answer=data.student_answer.model_dump(),
        complexity_result=check.model_dump(),
        scores=data.scores,
    )

    output = EvaluationOutput(
        complexity_check=check,
        feedback=feedback,
    )

    # Database saving is optional for now.
    if data.session_id:
        save_evaluation_result(
            session_id=data.session_id,
            output=output,
        )

    return output


def save_evaluation_result(
    *,
    session_id: str,
    output: EvaluationOutput,
) -> None:

    import uuid

    from sqlmodel import Session, select

    from .database import (
        EvaluationResult,
        engine,
    )

    session_uuid = uuid.UUID(session_id)

    coaching_json: dict[str, Any] = {
        "complexity_check":
            output.complexity_check.model_dump(),

        "feedback":
            output.feedback.model_dump(),
    }

    with Session(engine) as session:

        result = session.exec(
            select(EvaluationResult).where(
                EvaluationResult.session_id
                == session_uuid
            )
        ).first()

        passed = (
            output.complexity_check.matches
            and output.complexity_check.sanity_passed
        )

        if result:

            result.passed_time_complexity = passed
            result.ai_coaching = coaching_json

            session.add(result)

        else:

            result = EvaluationResult(
                session_id=session_uuid,
                passed_time_complexity=passed,
                ai_coaching=coaching_json,
            )

            session.add(result)

        session.commit()