from __future__ import annotations

import re


FILLER_WORDS = [
    "um",
    "uh",
    "like",
    "you know",
    "basically",
    "actually",
    "so",
]

# A pause of 2 seconds or more is considered a long pause.
LONG_PAUSE_THRESHOLD_SECONDS = 2.0


def tokenize_words(text: str) -> list[str]:
    """Return normalized words from the transcript."""

    return re.findall(
        r"\b[\w']+\b",
        text.lower(),
    )


def count_fillers(
    text: str,
) -> tuple[int, list[str]]:
    """Count conversational filler words."""

    normalized = text.lower()
    detected = []

    for filler in FILLER_WORDS:
        pattern = rf"\b{re.escape(filler)}\b"

        matches = re.findall(
            pattern,
            normalized,
        )

        detected.extend(
            [filler] * len(matches)
        )

    return len(detected), detected


def calculate_wpm(
    word_count: int,
    duration_seconds: float,
) -> float:
    """Calculate words per minute."""

    if duration_seconds <= 0:
        return 0.0

    return round(
        (word_count / duration_seconds) * 60,
        1,
    )


def classify_pace(
    wpm: float,
) -> str:
    """
    Classify speaking pace.

    < 110 WPM   -> too_slow
    110-160 WPM -> ideal
    > 160 WPM   -> too_fast
    """

    if wpm < 110:
        return "too_slow"

    if wpm <= 160:
        return "ideal"

    return "too_fast"


def detect_long_pauses(
    segments: list[dict],
    threshold_seconds: float = LONG_PAUSE_THRESHOLD_SECONDS,
) -> list[dict]:
    """
    Detect long pauses using Whisper word timestamps.

    A pause is calculated as:

        next_word.start - previous_word.end

    Only pauses >= threshold_seconds are returned.

    This information is calculated internally because the
    strict Track 3 output contract does not currently expose
    pause fields.
    """

    words = []

    for segment in segments:
        for word in segment.get("words", []):
            start = word.get("start")
            end = word.get("end")

            if start is None or end is None:
                continue

            words.append(
                {
                    "word": word.get("word", "").strip(),
                    "start": float(start),
                    "end": float(end),
                }
            )

    words.sort(key=lambda item: item["start"])

    long_pauses = []

    for previous, current in zip(words, words[1:]):
        pause_duration = current["start"] - previous["end"]

        if pause_duration >= threshold_seconds:
            long_pauses.append(
                {
                    "start": round(previous["end"], 3),
                    "end": round(current["start"], 3),
                    "duration_seconds": round(
                        pause_duration,
                        3,
                    ),
                }
            )

    return long_pauses


def calculate_speech_metrics(
    transcript: str,
    duration_seconds: float,
    segments: list[dict] | None = None,
) -> dict:
    """
    Calculate Track 3 speech metrics.

    The returned dictionary intentionally matches the
    strict Track 3 contract exactly.
    """

    words = tokenize_words(transcript)

    word_count = len(words)

    wpm = calculate_wpm(
        word_count,
        duration_seconds,
    )

    filler_count, fillers_detected = count_fillers(
        transcript
    )

    # Calculate pauses internally.
    # They are intentionally not added to the returned
    # dictionary because Track 3 has a strict output contract.
    if segments:
        detect_long_pauses(segments)

    return {
        "duration_seconds": round(
            duration_seconds,
            3,
        ),
        "word_count": word_count,
        "words_per_minute": wpm,
        "filler_words_count": filler_count,
        "filler_words_detected": fillers_detected,
        "pace_status": classify_pace(wpm),
    }


if __name__ == "__main__":

    sample_text = (
        "Um, so I would first sort the array. "
        "Like, that takes O n log n time. "
        "Actually, we can use a hash map."
    )

    sample_segments = [
        {
            "words": [
                {
                    "word": "Hello",
                    "start": 0.2,
                    "end": 0.7,
                },
                {
                    "word": "my",
                    "start": 0.8,
                    "end": 1.0,
                },
                {
                    "word": "name",
                    "start": 1.1,
                    "end": 1.5,
                },
                {
                    "word": "is",
                    "start": 4.0,
                    "end": 4.2,
                },
            ]
        }
    ]

    print("========== METRICS TEST ==========")

    result = calculate_speech_metrics(
        sample_text,
        20.0,
        sample_segments,
    )

    print(result)

    print("\n========== PAUSE TEST ==========")

    pauses = detect_long_pauses(
        sample_segments
    )

    print(pauses)