"""Unified ML evaluation scorer for technical interview transcripts.

This module acts as the Track 1 evaluation facade, coordinating technical entity extraction
(NER via spaCy/GLiNER) and semantic vector matching (SentenceTransformer) to evaluate
candidate performance against problem rubrics.

Supports both:
1. Production use case: direct evaluation with database Problem.rubric or DB session.
2. Mock / offline testing: built-in problem rubrics from seed definitions and interactive CLI.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure backend package can be imported regardless of execution working directory
current_dir = Path(__file__).resolve().parent
project_src = current_dir.parent
if str(project_src) not in sys.path:
    sys.path.insert(0, str(project_src))

try:
    from backend.ner_extractor import TechnicalEntityExtractor
    from backend.vector_engine import evaluate_semantic_match
except ImportError:
    from ner_extractor import TechnicalEntityExtractor
    from vector_engine import evaluate_semantic_match


def get_seed_rubrics() -> dict[str, dict[str, Any]]:
    """Load rubric dictionaries for all seeded problems without requiring a running database."""
    try:
        from backend.seed import get_seed_problems
        return {p["id"]: p["rubric"] for p in get_seed_problems()}
    except Exception:
        # Fallback minimal definitions if seed module cannot be loaded
        return {
            "two-sum": {
                "approaches": [
                    {
                        "tier": "brute_force",
                        "strategy_phrases": ["nested loops", "check all pairs"],
                        "expected_time": "O(n^2)",
                        "is_optimal": False,
                    },
                    {
                        "tier": "optimal",
                        "strategy_phrases": ["hash map", "single pass", "store complement"],
                        "expected_time": "O(n)",
                        "is_optimal": True,
                    },
                ],
                "mandatory_edge_cases": ["Negative numbers", "Duplicate numbers"],
            }
        }


class InterviewScorer:
    """Unified coordinator for technical transcript extraction and semantic scoring."""

    def __init__(self) -> None:
        """Initialize NER and Vector engines once during instantiation."""
        self.ner_extractor: TechnicalEntityExtractor = TechnicalEntityExtractor()

    def evaluate_transcript(
        self,
        raw_transcript: str,
        rubric: dict[str, Any],
    ) -> dict[str, Any]:
        """Evaluate a raw spoken interview transcript against a problem rubric dictionary.

        Args:
            raw_transcript: Spoken candidate transcript to normalize and evaluate.
            rubric: Problem rubric dictionary containing 'approaches' and optionally
                'required_complexity' or 'mandatory_edge_cases' (matches Problem.rubric schema).

        Returns:
            dict[str, Any]: Aggregated evaluation result containing:
                - normalized_transcript (str): Text after STT regex cleaning.
                - entities (dict[str, list[str]]): Extracted technical entities.
                - matched_tier (str): Winning approach tier or 'UNCLEAR_OR_INVALID'.
                - similarity_score (float): Cosine similarity score rounded to 3 decimals.
                - is_optimal_strategy (bool): Flag indicating if strategy is optimal.
                - passed_time_complexity (bool): Whether required complexity was stated.
                - passed_edge_cases (bool): Whether at least one edge case was mentioned.
        """
        # 1. Extraction & Normalization
        ner_result: dict[str, Any] = self.ner_extractor.extract_entities(raw_transcript)
        normalized_transcript: str = ner_result.get("normalized_transcript", "")
        entities: dict[str, list[str]] = ner_result.get(
            "entities",
            {
                "DATA_STRUCTURE": [],
                "ALGORITHMIC_STRATEGY": [],
                "EDGE_CASE": [],
                "COMPLEXITY": [],
            },
        )

        # 2. Semantic Matching
        approaches: list[dict[str, Any]] = rubric.get("approaches", [])
        vector_result: dict[str, Any] = evaluate_semantic_match(
            transcript=normalized_transcript,
            rubric_approaches=approaches,
        )

        matched_tier: str = vector_result.get("matched_tier", "UNCLEAR_OR_INVALID")
        similarity_score: float = float(vector_result.get("similarity_score", 0.0))
        is_optimal_strategy: bool = bool(
            vector_result.get("is_optimal", False)
            or (matched_tier.lower() == "optimal" and matched_tier != "UNCLEAR_OR_INVALID")
        )

        # 3. Boolean Grading Logic
        required_complexity: Optional[str] = rubric.get("required_complexity")
        if not required_complexity:
            # Fallback to the optimal approach's expected_time from database Problem.rubric
            for app in approaches:
                if app.get("is_optimal"):
                    required_complexity = app.get("expected_time")
                    break

        extracted_complexities: list[str] = entities.get("COMPLEXITY", [])
        passed_time_complexity: bool = self._check_complexity(
            required=required_complexity,
            extracted=extracted_complexities,
        )

        extracted_edge_cases: list[str] = entities.get("EDGE_CASE", [])
        passed_edge_cases: bool = len(extracted_edge_cases) > 0

        # 4. Cross-Validation Guardrail (NLP Negation Protection)
        # If the Vector Engine set is_optimal_strategy to True, but the NER engine set
        # passed_time_complexity to False (e.g. candidate said "I won't use a hash map, I'll sort in O(n log n)"),
        # penalize to protect against semantic negation blindspots:
        # 1. Force is_optimal_strategy = False
        # 2. Change matched_tier to fallback tier (if another non-optimal tier hit threshold) or "sub_optimal_downgrade"
        if is_optimal_strategy and not passed_time_complexity:
            is_optimal_strategy = False
            fallback_tier: Optional[str] = vector_result.get("fallback_tier")
            matched_tier = fallback_tier if fallback_tier else "sub_optimal_downgrade"

        # 5. Result Aggregation
        return {
            "normalized_transcript": normalized_transcript,
            "entities": entities,
            "matched_tier": matched_tier,
            "similarity_score": similarity_score,
            "is_optimal_strategy": is_optimal_strategy,
            "passed_time_complexity": passed_time_complexity,
            "passed_edge_cases": passed_edge_cases,
        }

    def evaluate_problem(
        self,
        problem_id: str,
        raw_transcript: str,
        db_session: Optional[Any] = None,
    ) -> dict[str, Any]:
        """Convenience method: Evaluate a transcript by problem ID.

        Attempts to load the rubric from an active database session first;
        if none is provided or found, falls back to seed rubrics.

        Args:
            problem_id: Problem identifier (e.g. 'two-sum', 'valid-anagram').
            raw_transcript: Candidate transcript to evaluate.
            db_session: Optional SQLModel / SQLAlchemy database session.

        Returns:
            dict[str, Any]: Evaluation dictionary with an added 'problem_id' key.
        """
        rubric: Optional[dict[str, Any]] = None

        # 1. Try fetching from database if a session is provided
        if db_session is not None:
            try:
                from backend.database import Problem
                problem = db_session.get(Problem, problem_id)
                if problem and problem.rubric:
                    rubric = problem.rubric
            except Exception:
                rubric = None

        # 2. Fallback to seed problem rubrics
        if rubric is None:
            seed_rubrics = get_seed_rubrics()
            if problem_id in seed_rubrics:
                rubric = seed_rubrics[problem_id]

        if rubric is None:
            raise ValueError(
                f"Problem rubric not found for '{problem_id}'. "
                f"Available seed problems: {list(get_seed_rubrics().keys())}"
            )

        result = self.evaluate_transcript(raw_transcript, rubric)
        result["problem_id"] = problem_id
        return result

    @staticmethod
    def _check_complexity(required: Optional[str], extracted: list[str]) -> bool:
        """Verify whether required complexity matches any extracted complexity."""
        if not required or not extracted:
            return False

        req_clean: str = required.replace(" ", "").lower()
        return any(req_clean == c.replace(" ", "").lower() for c in extracted)


if __name__ == "__main__":
    scorer = InterviewScorer()
    seed_rubrics = get_seed_rubrics()

    # Mode 1: Interactive Prompt (pass -i or --interactive)
    if len(sys.argv) > 1 and sys.argv[1] in ("-i", "--interactive"):
        print("\n" + "=" * 70)
        print("INTERACTIVE ML EVALUATION MODE")
        print("=" * 70)
        available_ids = list(seed_rubrics.keys())
        print("Available Problems:")
        for idx, pid in enumerate(available_ids, 1):
            print(f"  [{idx}] {pid}")

        choice = input("\nSelect problem number or ID (default: two-sum) > ").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(available_ids):
            selected_problem = available_ids[int(choice) - 1]
        elif choice in available_ids:
            selected_problem = choice
        else:
            selected_problem = "two-sum"

        print(f"\nEvaluating against problem: '{selected_problem}'")
        print("Type your transcript below (or 'exit' to quit):\n")
        while True:
            try:
                user_transcript = input("Transcript > ").strip()
                if user_transcript.lower() in ("exit", "quit", "q"):
                    break
                if not user_transcript:
                    continue
                result = scorer.evaluate_problem(selected_problem, user_transcript)
                print("\nResult:")
                print(json.dumps(result, indent=2))
                print("-" * 70)
            except (KeyboardInterrupt, EOFError):
                break

    # Mode 2: Direct CLI input (e.g. uv run python scorer.py "my transcript" valid-anagram)
    elif len(sys.argv) > 1:
        custom_transcript = sys.argv[1]
        problem_id = sys.argv[2] if len(sys.argv) > 2 else "two-sum"
        print(f"\n--- EVALUATING AGAINST '{problem_id}' ---")
        result = scorer.evaluate_problem(problem_id, custom_transcript)
        print(json.dumps(result, indent=2))

    # Mode 3: Built-in Mock Verification Battery (runs multiple problem scenarios)
    else:
        print("\n" + "=" * 70)
        print("RUNNING BUILT-IN VERIFICATION BATTERY ACROSS SEED RUBRICS")
        print("=" * 70)

        test_cases = [
            {
                "name": "Two Sum - Optimal Hash Map Strategy",
                "problem_id": "two-sum",
                "transcript": (
                    "For two sum, I will use a hash map to store each number and its index in a single pass. "
                    "This approach gives an optimal time complexity of big o of n. "
                    "As for edge cases, we should account for duplicate elements and negative numbers."
                ),
            },
            {
                "name": "Two Sum - Brute Force Nested Loops",
                "problem_id": "two-sum",
                "transcript": (
                    "As a baseline, the easiest way is checking all pairs. So I'll set up nested loops, "
                    "where the outer loop holds one number and the inner scans the rest. It takes order n squared time, "
                    "and constant space."
                ),
            },
            {
                "name": "Valid Anagram - Optimal Frequency Counter",
                "problem_id": "valid-anagram",
                "transcript": (
                    "To check if two strings are anagrams, I'll use a character frequency counter or a fixed size array of 26 integers. "
                    "In a single pass comparison, I increment counts for string s and decrement for string t. "
                    "The time complexity will be big o of n and space is constant. "
                    "For edge cases, strings of different lengths should immediately return false."
                ),
            },
        ]

        for tc in test_cases:
            print(f"\n--- Scenario: {tc['name']} ({tc['problem_id']}) ---")
            eval_output = scorer.evaluate_problem(tc["problem_id"], tc["transcript"])
            print(json.dumps(eval_output, indent=2))

        print("\n" + "=" * 70)
        print("Tip: Run interactively to test any custom transcript on any problem:")
        print("  uv run python scorer.py -i")
        print("Or evaluate directly:")
        print('  uv run python scorer.py "I will sort both strings" valid-anagram')
        print("=" * 70)
