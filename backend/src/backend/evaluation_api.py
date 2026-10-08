from fastapi import APIRouter, HTTPException
import traceback

from .evaluation import evaluate_track1
from .schemas import EvaluationOutput, Track1Input


router = APIRouter(
    prefix="/api/evaluation",
    tags=["Evaluation"],
)


@router.post(
    "/feedback",
    response_model=EvaluationOutput,
)
def evaluate_feedback(
    data: Track1Input,
) -> EvaluationOutput:

    try:
        return evaluate_track1(data)

    except ValueError as exc:
        print("\n========== EVALUATION VALUE ERROR ==========")
        print(str(exc))
        print("============================================\n", flush=True)

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        print("\n========== EVALUATION ERROR ==========")
        print(str(exc))
        traceback.print_exc()
        print("======================================\n", flush=True)

        raise HTTPException(
            status_code=500,
            detail="Evaluation failed. Check backend logs.",
        ) from exc