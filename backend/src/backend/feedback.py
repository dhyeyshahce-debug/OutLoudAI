import os

from dotenv import load_dotenv
from google import genai

from .schemas import Feedback


load_dotenv()


class GeminiFeedbackService:

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in .env")

        self.model = model
        self.client = genai.Client(api_key=api_key)

    def generate_feedback(
        self,
        problem_id: str,
        student_answer: dict,
        complexity_result: dict,
        scores: dict,
    ) -> Feedback:

        prompt = f"""
You are an interview coding evaluator for OutLoudAI.

Evaluate the student's coding interview answer.

Problem ID:
{problem_id}

Student answer:
{student_answer}

Complexity check:
{complexity_result}

Track 1 scores:
{scores}

Generate concise, constructive feedback.

Rules:
1. strengths must contain specific things the student did well.
2. weaknesses must contain specific mistakes or missing concepts.
3. progressive_hints must guide the student from their current approach
   toward a better solution.
4. Do NOT give the complete solution.
5. Do NOT invent information that is not present.
6. Return ONLY the required JSON structure.
"""

        interaction = self.client.interactions.create(
            model=self.model,
            input=prompt,
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": Feedback.model_json_schema(),
            },
        )

        return Feedback.model_validate_json(
            interaction.output_text
        )