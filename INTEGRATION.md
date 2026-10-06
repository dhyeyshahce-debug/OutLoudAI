# OutLoudAI - Task 2 Integration

## Backend dependency

From `backend/`:

```bash
uv add google-genai fastapi
```

`python-dotenv`, `pydantic`, and `sqlmodel` are already used by the project.

## Environment

Add to `backend/.env`:

```env
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Never commit `.env`.

## FastAPI

The main FastAPI application is owned by the integration/server teammate.

Add this router to the main FastAPI app:

```python
from backend.evaluation_api import router as evaluation_router

app.include_router(evaluation_router)
```

## Track 1 contract

Track 1 should send:

```json
{
  "problem_id": "two-sum",
  "scores": {
    "correctness": 85,
    "strategy": 80,
    "edge_cases": 70,
    "efficiency": 60
  },
  "student_answer": {
    "time_complexity": "O(n^2)",
    "space_complexity": "O(1)",
    "explanation": "I use two nested loops to compare every pair."
  },
  "session_id": "existing-interview-session-uuid"
}
```

`expected_time_complexity` can be omitted. The service will read the optimal expected complexity from the existing `Problem.rubric`.

## Frontend

Copy `EvaluationFeedback.tsx` into the existing React frontend and render it wherever the final evaluation is displayed.

Add:

```env
VITE_API_URL=http://localhost:8000
```

The frontend then calls:

```text
POST /api/evaluation/feedback
```

## Important architecture rule

This module owns:
- deterministic complexity checking
- Gemini coaching
- strict Pydantic validation
- persistence into `EvaluationResult`

It does NOT own:
- audio processing
- Whisper
- Track 1 ML/vector engine
- InterviewSession creation
- the master `/evaluate` endpoint

The integration teammate can call this router/service after the other tracks are complete.
