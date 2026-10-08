"""
Technical Entity Extractor for spoken technical interview transcripts.

Implements a 3-phase hybrid entity extraction pipeline:
1. Regex Normalization (STT spoken Big-O and technical term cleaning).
2. Hybrid Extraction using spaCy PhraseMatcher (exact dictionary) and GLiNER zero-shot NER.
3. Resolution & Deduplication (priority resolution, stop-word stripping, category deduplication).
"""

from __future__ import annotations

import json
import re
from re import Pattern
from typing import Any, Dict, List, Optional, Set, Tuple

import spacy
from spacy.matcher import PhraseMatcher
from gliner import GLiNER


# --- EXACT DICTIONARIES FOR SPACY PHRASEMATCHER ---

EXACT_ENTITIES: dict[str, list[str]] = {
    "DATA_STRUCTURE": [
        # Hash based
        "hash map",
        "hash maps",
        "hash table",
        "hash tables",
        "hash set",
        "hash sets",
        "dictionary",
        "map",
        "set",
        "sets",
        # Linear collections
        "array",
        "arrays",
        "list",
        "lists",
        "linked list",
        "linked lists",
        "doubly linked list",
        "stack",
        "stacks",
        "queue",
        "queues",
        "deque",
        "pointer",
        "pointers",
        "variable",
        "variables",
        # Heaps & Priority Queues
        "priority queue",
        "priority queues",
        "min-heap",
        "min-heaps",
        "min heap",
        "min heaps",
        "max-heap",
        "max-heaps",
        "max heap",
        "max heaps",
        "heap",
        "heaps",
        # Trees & Graphs
        "binary search tree",
        "binary search trees",
        "bst",
        "binary tree",
        "binary trees",
        "tree",
        "trees",
        "trie",
        "tries",
        "graph",
        "graphs",
        "matrix",
        "2d array",
    ],
    "ALGORITHMIC_STRATEGY": [
        # Brute Force & Baselines
        "brute force",
        "brute-force",
        "brute force approach",
        "brute-force approach",
        # Traversal & Pointers
        "two pointers",
        "fast and slow pointers",
        "sliding window",
        "single pass",
        "two pass",
        "two passes",
        "nested loops",
        "traversal",
        "traverse",
        "linear traversal",
        "linear scan",
        "linear search",
        "iteration",
        "iterate",
        "in-place swap",
        "swap",
        "swapping",
        # Searching & Graph Traversals
        "binary search",
        "bfs",
        "dfs",
        "breadth first search",
        "depth first search",
        "level order traversal",
        "in-order traversal",
        "pre-order traversal",
        "post-order traversal",
        # Sorting
        "selection sort",
        "bubble sort",
        "insertion sort",
        "merge sort",
        "quick sort",
        "counting sort",
        "topological sort",
        "sorting",
        "sort",
        # Paradigms
        "recursion",
        "recursive",
        "dynamic programming",
        "memoization",
        "tabulation",
        "divide and conquer",
        "backtracking",
        "greedy",
        "greedy approach",
        "prefix sum",
        "bit manipulation",
    ],
    "EDGE_CASE": [
        # Collections & Strings
        "empty array",
        "empty arrays",
        "empty list",
        "empty string",
        "null input",
        "null inputs",
        "null pointer",
        "null check",
        "different lengths",
        "different length",
        "different sizes",
        "different size",
        "length mismatch",
        "fewer than two elements",
        # Numerical & Boundary
        "negative numbers",
        "negative number",
        "negative values",
        "duplicates",
        "duplicate",
        "duplicate elements",
        "overflow",
        "integer overflow",
        "division by zero",
        "odd length",
        "even length",
        "single element",
        "single node",
        "out of bounds",
    ],
    "COMPLEXITY": [
        "O(1)",
        "O(n)",
        "O(n log n)",
        "O(n^2)",
        "O(log n)",
        "O(2^n)",
        "O(n!)",
    ],
}

# Generic discourse / meta terms that should not be extracted as specific entities
META_TERMS: set[str] = {
    "time complexity",
    "space complexity",
    "complexity",
    "edge case",
    "edge cases",
    "critical edge case",
    "critical edge cases",
    "data structure",
    "data structures",
    "algorithmic strategy",
    "strategy",
    "approach",
    "starting element",
    "remaining elements",
    "element",
    "elements",
    "condition",
    "main loop",
    "outer loop",
    "inner loop",
}


class TechnicalEntityExtractor:
    """Hybrid Entity Extractor for technical interview spoken transcripts."""

    _instance: Optional["TechnicalEntityExtractor"] = None
    _nlp: Optional[spacy.language.Language] = None
    _gliner: Optional[GLiNER] = None
    _matcher: Optional[PhraseMatcher] = None
    _initialized: bool = False

    def __new__(cls, *args: Any, **kwargs: Any) -> "TechnicalEntityExtractor":
        """Singleton pattern: ensures class instance can be reused."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(
        self,
        gliner_model_name: str = "urchade/gliner_small-v2.1",
        gliner_threshold: float = 0.40,
    ) -> None:
        """Load spaCy and GLiNER models once (singleton / reusable pattern)."""
        if TechnicalEntityExtractor._initialized:
            return

        self.gliner_model_name: str = gliner_model_name
        self.gliner_threshold: float = gliner_threshold

        # Initialize models once
        if TechnicalEntityExtractor._nlp is None:
            TechnicalEntityExtractor._nlp = spacy.load("en_core_web_sm")

        if TechnicalEntityExtractor._gliner is None:
            TechnicalEntityExtractor._gliner = GLiNER.from_pretrained(
                self.gliner_model_name
            )

        if TechnicalEntityExtractor._matcher is None:
            TechnicalEntityExtractor._matcher = self._build_phrase_matcher(
                TechnicalEntityExtractor._nlp
            )

        self.nlp: spacy.language.Language = TechnicalEntityExtractor._nlp
        self.gliner: GLiNER = TechnicalEntityExtractor._gliner
        self.matcher: PhraseMatcher = TechnicalEntityExtractor._matcher

        # Compile normalization patterns
        self.big_o_patterns: list[tuple[Pattern[str], str]] = [
            # n log n / linearithmic
            (
                re.compile(
                    r"\b(?:(?:(?:big\s+)?o|order)\s+(?:of\s+)?\s*n\s+log\s+n|linearithmic\s+time)\b",
                    re.IGNORECASE,
                ),
                "O(n log n)",
            ),
            # n squared / quadratic (handles 'o of n square', 'o of n squared', 'big o of n squared')
            (
                re.compile(
                    r"\b(?:(?:(?:big\s+)?o|order)\s+(?:of\s+)?\s*n\s*(?:squared?|\^2)|quadratic\s+time)\b",
                    re.IGNORECASE,
                ),
                "O(n^2)",
            ),
            # log n / logarithmic
            (
                re.compile(
                    r"\b(?:(?:(?:big\s+)?o|order)\s+(?:of\s+)?\s*log\s+n|(?:logarithmic|log)\s+time)\b",
                    re.IGNORECASE,
                ),
                "O(log n)",
            ),
            # n / linear (ordered after n log n and n squared)
            (
                re.compile(
                    r"\b(?:(?:(?:big\s+)?o|order)\s+(?:of\s+)?\s*n|linear\s+time)\b",
                    re.IGNORECASE,
                ),
                "O(n)",
            ),
            # 1 / constant time
            (
                re.compile(
                    r"\b(?:(?:(?:big\s+)?o|order)\s+(?:of\s+)?\s*1|constant\s+time)\b",
                    re.IGNORECASE,
                ),
                "O(1)",
            ),
        ]

        self.term_patterns: list[tuple[Pattern[str], str]] = [
            # Common STT typos / variants
            (re.compile(r"\b(?:travserse|traverese)\b", re.IGNORECASE), "traverse"),
            (re.compile(r"\bhashmaps\b", re.IGNORECASE), "hash maps"),
            (re.compile(r"\bhashmap\b", re.IGNORECASE), "hash map"),
            (re.compile(r"\bhashtables\b", re.IGNORECASE), "hash tables"),
            (re.compile(r"\bhashtable\b", re.IGNORECASE), "hash table"),
            (re.compile(r"\bhashsets\b", re.IGNORECASE), "hash sets"),
            (re.compile(r"\bhashset\b", re.IGNORECASE), "hash set"),
            (re.compile(r"\btwo\s+pointer\b", re.IGNORECASE), "two pointers"),
            (re.compile(r"\bfast\s+and\s+slow\s+pointer\b", re.IGNORECASE), "fast and slow pointers"),
            (re.compile(r"\bsliding\s+windows\b", re.IGNORECASE), "sliding window"),
        ]

        TechnicalEntityExtractor._initialized = True

    @staticmethod
    def _build_phrase_matcher(nlp: spacy.language.Language) -> PhraseMatcher:
        """Construct a spaCy PhraseMatcher with dictionary terms."""
        matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
        for label, phrases in EXACT_ENTITIES.items():
            patterns = [nlp.make_doc(phrase) for phrase in phrases]
            matcher.add(label, patterns)
        return matcher

    def normalize_stt(self, transcript: str) -> str:
        """Phase 1: Spoken STT Cleaning and Regex Normalization."""
        text = transcript

        # 1. Normalize Big-O phrases
        for pattern, replacement in self.big_o_patterns:
            text = pattern.sub(replacement, text)

        # 2. Normalize technical terms
        for pattern, replacement in self.term_patterns:
            text = pattern.sub(replacement, text)

        return text

    def extract_entities(self, transcript: str) -> dict[str, Any]:
        """
        Extract technical entities from a transcript using the 3-phase hybrid pipeline.

        Returns:
            {
                "normalized_transcript": str,
                "entities": {
                    "DATA_STRUCTURE": list[str],
                    "ALGORITHMIC_STRATEGY": list[str],
                    "EDGE_CASE": list[str],
                    "COMPLEXITY": list[str]
                },
                "metadata": {
                    "spacy_count": int,
                    "gliner_count": int,
                    "resolved_total": int
                }
            }
        """
        # Constraint: Gracefully handle empty or whitespace-only inputs without ML invocation
        if not transcript or not transcript.strip():
            return {
                "normalized_transcript": transcript or "",
                "entities": {
                    "DATA_STRUCTURE": [],
                    "ALGORITHMIC_STRATEGY": [],
                    "EDGE_CASE": [],
                    "COMPLEXITY": [],
                },
                "metadata": {
                    "spacy_count": 0,
                    "gliner_count": 0,
                    "resolved_total": 0,
                },
            }

        # --- Phase 1: Regex Normalization ---
        normalized_transcript = self.normalize_stt(transcript)

        # --- Phase 2: Hybrid Extraction ---
        # 1. spaCy PhraseMatcher (Exact Dictionary)
        doc = self.nlp(normalized_transcript)
        raw_matches = self.matcher(doc)
        spacy_spans: list[dict[str, Any]] = []

        for match_id, start_token, end_token in raw_matches:
            span = doc[start_token:end_token]
            label = self.nlp.vocab.strings[match_id]
            spacy_spans.append(
                {
                    "start": span.start_char,
                    "end": span.end_char,
                    "label": label,
                    "text": span.text,
                    "source": "spacy",
                }
            )

        # Filter internal overlaps among spaCy spans (prioritize longer matches)
        spacy_spans_sorted = sorted(
            spacy_spans,
            key=lambda s: (-(s["end"] - s["start"]), s["start"]),
        )
        accepted_spacy: list[dict[str, Any]] = []
        for s in spacy_spans_sorted:
            if not any(
                max(s["start"], a["start"]) < min(s["end"], a["end"])
                for a in accepted_spacy
            ):
                accepted_spacy.append(s)

        # 2. GLiNER Zero-Shot Extraction with natural language prompts
        gliner_label_map: dict[str, str] = {
            "algorithm": "ALGORITHMIC_STRATEGY",
            "algorithmic strategy": "ALGORITHMIC_STRATEGY",
            "data structure": "DATA_STRUCTURE",
            "edge case": "EDGE_CASE",
            "complexity": "COMPLEXITY",
        }
        raw_gliner_entities = self.gliner.predict_entities(
            normalized_transcript,
            list(gliner_label_map.keys()),
            threshold=self.gliner_threshold,
        )

        gliner_spans: list[dict[str, Any]] = []
        for ent in raw_gliner_entities:
            target_cat = gliner_label_map.get(str(ent["label"]).lower())
            if not target_cat:
                continue
            gliner_spans.append(
                {
                    "start": int(ent["start"]),
                    "end": int(ent["end"]),
                    "label": target_cat,
                    "text": str(ent["text"]),
                    "score": float(ent.get("score", 1.0)),
                    "source": "gliner",
                }
            )

        # --- Phase 3: Resolution & Deduplication ---
        # Prioritize spaCy exact matches over GLiNER for overlapping spans
        gliner_spans_sorted = sorted(
            gliner_spans,
            key=lambda g: (-g["score"], -(g["end"] - g["start"]), g["start"]),
        )
        accepted_gliner: list[dict[str, Any]] = []
        for g in gliner_spans_sorted:
            # Drop if overlaps with any accepted spaCy span
            if any(
                max(g["start"], s["start"]) < min(g["end"], s["end"])
                for s in accepted_spacy
            ):
                continue
            # Drop if overlaps with any already accepted GLiNER span
            if any(
                max(g["start"], a["start"]) < min(g["end"], a["end"])
                for a in accepted_gliner
            ):
                continue
            accepted_gliner.append(g)

        # Combine all accepted spans in original order of occurrence
        all_accepted = accepted_spacy + accepted_gliner
        all_accepted.sort(key=lambda x: x["start"])

        # Populate categories, strip leading stop-words/articles, lowercase & deduplicate
        entities: dict[str, list[str]] = {
            "DATA_STRUCTURE": [],
            "ALGORITHMIC_STRATEGY": [],
            "EDGE_CASE": [],
            "COMPLEXITY": [],
        }

        for item in all_accepted:
            category = item["label"]
            if category not in entities:
                continue

            term = item["text"].strip()
            # Strip leading stop-words / articles ("a", "an", "the")
            term = re.sub(r"^(?:a|an|the)\s+", "", term, flags=re.IGNORECASE).strip()

            # Preserve exact casing from normalized transcript for COMPLEXITY (e.g. O(n log n)),
            # lowercase all other categories
            if category != "COMPLEXITY":
                term = term.lower()

            # Ignore empty or generic discourse / meta terms
            if not term or term.lower() in META_TERMS:
                continue

            # Deduplicate per category
            if category == "COMPLEXITY":
                # Filter out conversational phrases (e.g. 'optimal time complexity')
                # and retain only canonical Big-O notations (must match r"(?i)^O\([^)]+\)$" or contain "O(")
                if not (re.match(r"(?i)^O\([^)]+\)$", term.strip()) or "O(" in term):
                    continue
                if not any(c.lower() == term.lower() for c in entities[category]):
                    entities[category].append(term)
            else:
                if term not in entities[category]:
                    entities[category].append(term)

        total_resolved = sum(len(terms) for terms in entities.values())

        return {
            "normalized_transcript": normalized_transcript,
            "entities": entities,
            "metadata": {
                "spacy_count": len(spacy_spans),
                "gliner_count": len(gliner_spans),
                "resolved_total": total_resolved,
            },
        }


if __name__ == "__main__":
    import sys

    print("=" * 70)
    print("Initializing TechnicalEntityExtractor...")
    print("=" * 70)
    extractor = TechnicalEntityExtractor()

    # Mode 1: Interactive Prompt (pass -i or --interactive)
    if len(sys.argv) > 1 and sys.argv[1] in ("-i", "--interactive"):
        print("\n--- INTERACTIVE MODE ---")
        print("Type your transcript below and press Enter (or type 'exit' to quit):\n")
        while True:
            try:
                user_text = input("Enter transcript > ").strip()
                if user_text.lower() in ("exit", "quit", "q"):
                    print("Exiting interactive mode.")
                    break
                if not user_text:
                    continue
                res = extractor.extract_entities(user_text)
                print("\nExtracted Result:")
                print(json.dumps(res, indent=2))
                print("-" * 60)
            except (KeyboardInterrupt, EOFError):
                print("\nExiting interactive mode.")
                break

    # Mode 2: Direct Command Line Argument (e.g. uv run python src/backend/ner_extractor.py "my transcript")
    elif len(sys.argv) > 1:
        custom_input = " ".join(sys.argv[1:])
        print(f"\n--- CUSTOM INPUT EVALUATION ---")
        print(f"Raw Input:\n{custom_input}\n")
        res = extractor.extract_entities(custom_input)
        print("Extracted Result:")
        print(json.dumps(res, indent=2))

    # Mode 3: Default Verification with Built-in Samples
    else:
        # Sample Transcript 1: Big-O phrases, hashmap normalization, baseline complexities, edge cases
        sample_1 = (
            "So the brute force approach uses nested loops to compare every element, "
            "which takes order n squared time and constant time space. But we can optimize "
            "this using a hashmap to store seen elements and their indices in a single pass. "
            "That reduces the time complexity to big o of n with big o of n space. "
            "For edge cases, we should watch out for empty array and negative numbers."
        )

        # Sample Transcript 2: Two pointer, sliding windows, contextual data structures (min-heap / priority queue)
        sample_2 = (
            "I plan to use a two pointer technique with a sliding windows approach. "
            "We sort the array first, which takes big o of n log n time. During the iteration, "
            "we keep track of the smallest elements using a min-heap or a priority queue. "
            "We must also check duplicates and null input as critical edge cases."
        )

        print("\n--- SAMPLE 1 EVALUATION ---")
        print(f"Raw Input:\n{sample_1}\n")
        result_1 = extractor.extract_entities(sample_1)
        print("Extracted Result:")
        print(json.dumps(result_1, indent=2))

        print("\n--- SAMPLE 2 EVALUATION ---")
        print(f"Raw Input:\n{sample_2}\n")
        result_2 = extractor.extract_entities(sample_2)
        print("Extracted Result:")
        print(json.dumps(result_2, indent=2))

        print("\n--- EMPTY INPUT TEST ---")
        empty_result = extractor.extract_entities("   ")
        print("Extracted Empty Result:")
        print(json.dumps(empty_result, indent=2))

        print("\n" + "=" * 70)
        print("Tip: Run interactively to type your own transcripts:")
        print("  uv run python src/backend/ner_extractor.py -i")
        print("Or pass text directly:")
        print('  uv run python src/backend/ner_extractor.py "I used a hashmap with order n time"')
        print("=" * 70)

