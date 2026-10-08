import re
from typing import Any


_COMPLEXITY_ALIASES = {
    "constant": "O(1)",
    "o(1)": "O(1)",
    "linear": "O(n)",
    "o(n)": "O(n)",
    "linearithmic": "O(n log n)",
    "o(nlogn)": "O(n log n)",
    "o(n log n)": "O(n log n)",
    "quadratic": "O(n^2)",
    "o(n^2)": "O(n^2)",
    "cubic": "O(n^3)",
    "o(n^3)": "O(n^3)",
    "logarithmic": "O(log n)",
    "o(log n)": "O(log n)",
    "exponential": "O(2^n)",
    "o(2^n)": "O(2^n)",
}


def normalize_complexity(value: str | None) -> str | None:
    if not value:
        return None

    text = value.strip().lower()
    text = text.replace(" ", "")
    text = text.replace("²", "^2").replace("³", "^3")

    if text in {"o(nlogn)", "o(n*logn)", "o(nlog(n))"}:
        return "O(n log n)"

    if text in _COMPLEXITY_ALIASES:
        return _COMPLEXITY_ALIASES[text]

    # Normalize common equivalent spellings.
    match = re.fullmatch(r"o\((.+)\)", text)
    if match:
        body = match.group(1).replace("*", "")
        body = body.replace("log(n)", "logn")
        if body == "nlogn":
            return "O(n log n)"
        if body == "n^2":
            return "O(n^2)"
        if body == "n^3":
            return "O(n^3)"
        if body == "n":
            return "O(n)"
        if body == "1":
            return "O(1)"
        if body == "logn":
            return "O(log n)"

    return value.strip()


def infer_complexity_from_explanation(explanation: str) -> set[str]:
    """
    Conservative sanity rules. These do not replace code analysis.
    They only detect obvious contradictions in a spoken explanation.
    """
    text = explanation.lower()
    hints: set[str] = set()

    nested_loop_patterns = [
        "nested loop",
        "two nested loops",
        "two loops inside",
        "loop inside a loop",
        "for loop inside",
    ]
    if any(pattern in text for pattern in nested_loop_patterns):
        hints.add("O(n^2)")

    if any(
        pattern in text
        for pattern in [
            "sort the array",
            "sorting the array",
            "sort first",
            "sorted array",
            "sort the intervals",
        ]
    ):
        hints.add("O(n log n)")

    if any(
        pattern in text
        for pattern in [
            "hash map",
            "hashmap",
            "dictionary",
            "set lookup",
            "hash table",
        ]
    ):
        hints.add("O(n)")

    if any(
        pattern in text
        for pattern in [
            "binary search",
            "binary-search",
        ]
    ):
        hints.add("O(log n)")

    return hints


def complexity_check(
    stated: str,
    expected: str | None,
    explanation: str = "",
) -> dict[str, Any]:
    stated_normalized = normalize_complexity(stated)
    expected_normalized = normalize_complexity(expected)

    matches = (
        expected_normalized is not None
        and stated_normalized == expected_normalized
    )

    inferred = infer_complexity_from_explanation(explanation)

    # Only mark sanity failure when the explanation contains an obvious
    # contradiction with the student's stated complexity.
    contradiction = bool(inferred) and stated_normalized not in inferred
    sanity_passed = not contradiction

    if expected_normalized is None:
        reason = (
            "No expected complexity was supplied. "
            "The explanation was checked only for obvious contradictions."
        )
    elif matches and sanity_passed:
        reason = "The stated complexity matches the expected complexity."
    elif not sanity_passed:
        reason = (
            f"The explanation suggests {', '.join(sorted(inferred))}, "
            f"which conflicts with the stated {stated_normalized}."
        )
    else:
        reason = (
            f"The expected complexity is {expected_normalized}, "
            f"but the student stated {stated_normalized}."
        )

    return {
        "stated_time": stated,
        "expected_time": expected,
        "matches": matches,
        "sanity_passed": sanity_passed,
        "reason": reason,
    }
