"""Semantic vector matching engine for interview transcript evaluation.

This module encodes student interview transcripts and compares them against rubric
approach strategies using dense vector embeddings and cosine similarity.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
import re
import torch
from sentence_transformers import SentenceTransformer, util

# Module-level singleton pattern: load the model once into server memory
MODEL_NAME: str = "all-MiniLM-L6-v2"
model: SentenceTransformer = SentenceTransformer(MODEL_NAME)

# Threshold below which an approach match is deemed unclear or invalid
SIMILARITY_THRESHOLD: float = 0.52


def evaluate_semantic_match(
    transcript: str,
    rubric_approaches: list[dict[str, Any]],
) -> dict[str, Any]:
    """Evaluate a candidate's transcript against rubric approaches using semantic vectors.

    Splits the candidate transcript into sentences before encoding to prevent embedding
    dilution against short rubric strategy phrases.

    Args:
        transcript: The student's spoken/written solution explanation.
        rubric_approaches: A list of rubric approach dictionaries, each containing:
            - tier (str): Approach classification identifier (e.g. 'optimal', 'brute_force').
            - strategy_phrases (list[str]): Key phrases or explanations representing the strategy.
            - is_optimal (bool): Flag indicating if the approach is considered optimal.

    Returns:
        dict[str, Any]: An evaluation dictionary with the following keys:
            - matched_tier (str): Winning rubric tier, or "UNCLEAR_OR_INVALID" if below threshold.
            - similarity_score (float): Max cosine similarity score rounded to 3 decimal places.
            - is_optimal (bool): Flag indicating if the winning tier is optimal.
    """
    # Edge case: Empty or whitespace-only transcript
    if not transcript or not transcript.strip():
        return {
            "matched_tier": "UNCLEAR_OR_INVALID",
            "similarity_score": 0.0,
            "is_optimal": False,
        }

    # Split transcript into sentence chunks to avoid semantic dilution
    sentences: list[str] = [
        s.strip() for s in re.split(r"[.!?]+", transcript) if s.strip()
    ]
    if not sentences:
        return {
            "matched_tier": "UNCLEAR_OR_INVALID",
            "similarity_score": 0.0,
            "is_optimal": False,
        }

    # Edge case: No rubric approaches provided
    if not rubric_approaches:
        return {
            "matched_tier": "UNCLEAR_OR_INVALID",
            "similarity_score": 0.0,
            "is_optimal": False,
        }

    # 1. Vector Encoding: Encode all non-empty sentences into a 2D tensor matrix
    sentence_matrix: torch.Tensor = model.encode(sentences, convert_to_tensor=True)

    optimal_approach: Optional[dict[str, Any]] = None
    optimal_score: float = -1.0

    highest_approach: Optional[dict[str, Any]] = None
    highest_score: float = -1.0

    # 2. Batch Similarity Calculation: Iterate through rubric approaches
    for approach in rubric_approaches:
        strategy_phrases: list[str] = approach.get("strategy_phrases", [])
        if not strategy_phrases:
            continue

        # Encode strategy phrases into a 2D tensor matrix
        strategy_matrix: torch.Tensor = model.encode(strategy_phrases, convert_to_tensor=True)

        # Compute cosine similarity between sentence matrix and strategy matrix
        # Output shape: (num_sentences, num_strategy_phrases)
        similarity_matrix: torch.Tensor = util.cos_sim(sentence_matrix, strategy_matrix)

        # Take .max().item() across both dimensions to find strongest alignment
        tier_score: float = float(similarity_matrix.max().item())

        is_tier_optimal: bool = bool(
            approach.get("is_optimal", False)
            or str(approach.get("tier", "")).lower() == "optimal"
        )

        if is_tier_optimal and tier_score > optimal_score:
            optimal_score = tier_score
            optimal_approach = approach

        if tier_score > highest_score:
            highest_score = tier_score
            highest_approach = approach

    # 3. Optimal Override & Circuit Breaker Thresholding
    # If the optimal tier meets threshold, it automatically wins over brute force
    fallback_tier: Optional[str] = None
    if optimal_approach is not None and optimal_score >= SIMILARITY_THRESHOLD:
        winning_approach = optimal_approach
        winning_score = optimal_score
        # Record next highest non-optimal tier if it also cleared threshold
        if (
            highest_approach is not None
            and highest_approach != optimal_approach
            and highest_score >= SIMILARITY_THRESHOLD
        ):
            fallback_tier = str(highest_approach.get("tier"))
    elif highest_approach is not None and highest_score >= SIMILARITY_THRESHOLD:
        winning_approach = highest_approach
        winning_score = highest_score
    else:
        return {
            "matched_tier": "UNCLEAR_OR_INVALID",
            "similarity_score": round(max(highest_score, optimal_score, 0.0), 3),
            "is_optimal": False,
        }

    output_payload: dict[str, Any] = {
        "matched_tier": str(winning_approach.get("tier", "UNCLEAR_OR_INVALID")),
        "similarity_score": round(winning_score, 3),
        "is_optimal": bool(
            winning_approach.get("is_optimal", False)
            or str(winning_approach.get("tier", "")).lower() == "optimal"
        ),
    }
    if fallback_tier:
        output_payload["fallback_tier"] = fallback_tier

    return output_payload


if __name__ == "__main__":
    sample_rubric_approaches: list[dict[str, Any]] = [
        {
            "tier": "brute_force",
            "strategy_phrases": ["nested loops", "check all pairs"],
            "is_optimal": False,
        },
        {
            "tier": "optimal",
            "strategy_phrases": ["hash map", "single pass", "store complement"],
            "is_optimal": True,
        },
    ]

    test_transcript: str = (
        "I'll just iterate through the array and keep track of the numbers I need to "
        "hit the target in a lookup table."
    )

    evaluation_result = evaluate_semantic_match(test_transcript, sample_rubric_approaches)
    print(json.dumps(evaluation_result, indent=2))
