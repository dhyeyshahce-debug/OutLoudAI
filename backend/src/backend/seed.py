import sys
from pathlib import Path
from typing import List, Dict, Any

# Ensure backend package can be imported regardless of execution working directory
current_dir = Path(__file__).resolve().parent
project_src = current_dir.parent
if str(project_src) not in sys.path:
    sys.path.insert(0, str(project_src))

from sqlmodel import Session, select
from backend.database import engine, Problem, RubricSchema, ApproachSchema, create_db_and_tables


def get_seed_problems() -> List[Dict[str, Any]]:
    two_sum_rubric = RubricSchema(
        approaches=[
            ApproachSchema(
                tier="brute_force",
                strategy_phrases=[
                    "nested loops",
                    "check all pairs",
                    "compare every element with every other element",
                    "double for loop",
                ],
                expected_time="O(n^2)",
                expected_space="O(1)",
                is_optimal=False,
                hint="Can you store previously seen numbers and their indices in a hash map to find the complement in O(1) time?",
            ),
            ApproachSchema(
                tier="optimal",
                strategy_phrases=[
                    "hash map",
                    "dictionary lookup",
                    "single pass",
                    "complement check",
                    "store number and index",
                ],
                expected_time="O(n)",
                expected_space="O(n)",
                is_optimal=True,
                hint=None,
            ),
        ],
        mandatory_edge_cases=[
            "Negative numbers in array (e.g. [-1, -2, -3, -4, -5], target = -8)",
            "Duplicate numbers that sum to target (e.g. [3, 3], target = 6)",
            "Target requiring zero (e.g. [0, 4, 3, 0], target = 0)",
            "Minimum length array with exactly two elements",
        ],
    )

    valid_anagram_rubric = RubricSchema(
        approaches=[
            ApproachSchema(
                tier="brute_force",
                strategy_phrases=[
                    "sort both strings",
                    "compare sorted strings",
                    "alphabetical sorting",
                ],
                expected_time="O(n log n)",
                expected_space="O(1) or O(n) depending on sorting implementation",
                is_optimal=False,
                hint="Instead of sorting the entire strings, can you count the frequency of each character using a hash map or fixed-size array?",
            ),
            ApproachSchema(
                tier="optimal",
                strategy_phrases=[
                    "character frequency counter",
                    "hash map",
                    "fixed size array of 26 integers",
                    "increment and decrement character counts",
                    "single pass comparison",
                ],
                expected_time="O(n)",
                expected_space="O(1)",
                is_optimal=True,
                hint=None,
            ),
        ],
        mandatory_edge_cases=[
            "Strings of different lengths (immediate false)",
            "Single character strings with matching vs non-matching letters",
            "Strings with identical characters but differing frequencies (e.g. 'aab' vs 'abb')",
            "Strings with identical characters in same order",
        ],
    )

    merge_intervals_rubric = RubricSchema(
        approaches=[
            ApproachSchema(
                tier="brute_force",
                strategy_phrases=[
                    "compare all pairs iteratively",
                    "nested loops merging overlapping intervals until no changes occur",
                    "graph connected components",
                ],
                expected_time="O(n^2)",
                expected_space="O(n)",
                is_optimal=False,
                hint="What happens if you sort the intervals by their start time first? Can you then merge them in a single linear pass?",
            ),
            ApproachSchema(
                tier="optimal",
                strategy_phrases=[
                    "sort by start time",
                    "linear scan",
                    "compare current start with previous end",
                    "update maximum end time in place or append",
                ],
                expected_time="O(n log n)",
                expected_space="O(n)",
                is_optimal=True,
                hint=None,
            ),
        ],
        mandatory_edge_cases=[
            "Single interval input (e.g. [[1, 4]])",
            "Intervals touching at boundary endpoints (e.g. [[1, 4], [4, 5]] -> [[1, 5]])",
            "One interval completely inside/enclosed by another (e.g. [[1, 10], [2, 6]] -> [[1, 10]])",
            "Already disjoint intervals requiring zero merges",
            "All intervals overlapping into a single merged interval",
        ],
    )

    return [
        {
            "id": "two-sum",
            "title": "Two Sum",
            "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
            "tags": ["Array", "Hash Table"],
            "rubric": two_sum_rubric.model_dump(),
        },
        {
            "id": "valid-anagram",
            "title": "Valid Anagram",
            "description": "Given two strings s and t, return true if t is an anagram of s, and false otherwise. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
            "tags": ["String", "Hash Table", "Sorting"],
            "rubric": valid_anagram_rubric.model_dump(),
        },
        {
            "id": "merge-intervals",
            "title": "Merge Intervals",
            "description": "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
            "tags": ["Array", "Sorting"],
            "rubric": merge_intervals_rubric.model_dump(),
        },
    ]


def seed_database() -> None:
    # Ensure tables exist
    create_db_and_tables()

    problems_data = get_seed_problems()
    inserted_count = 0
    skipped_count = 0

    with Session(engine) as session:
        for p_data in problems_data:
            existing = session.get(Problem, p_data["id"])
            if existing:
                print(f"[SKIP] Problem '{p_data['id']}' already exists in database.")
                skipped_count += 1
            else:
                problem = Problem(
                    id=p_data["id"],
                    title=p_data["title"],
                    description=p_data["description"],
                    tags=p_data["tags"],
                    rubric=p_data["rubric"],
                )
                session.add(problem)
                print(f"[INSERT] Added '{p_data['title']}' (id: {p_data['id']})")
                inserted_count += 1

        session.commit()

    print(f"\n--- Seeding Summary ---")
    print(f"Inserted: {inserted_count}")
    print(f"Skipped:  {skipped_count}")
    print("Database seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
