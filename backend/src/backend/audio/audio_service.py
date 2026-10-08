from __future__ import annotations

import json
import sys

from .audio_transcriber import transcribe_audio
from .speech_metrics import calculate_speech_metrics


def process_audio(
    audio_path_or_bytes: str | bytes,
) -> dict:
    """
    Main Track 3 audio pipeline.

    Input:
        Audio file path or audio bytes.

    Output:
        {
            "transcript_text": "...",
            "audio_metrics": {
                ...
            }
        }
    """

    transcription = transcribe_audio(
        audio_path_or_bytes
    )

    transcript = transcription["text"]

    duration = transcription[
        "duration_seconds"
    ]

    metrics = calculate_speech_metrics(
    transcript,
    duration,
    transcription["segments"],
    )

    return {
        "transcript_text": transcript,
        "audio_metrics": metrics,
    }


if __name__ == "__main__":

    if len(sys.argv) < 2:

        print(
            "Usage:\n"
            "uv run python -m "
            "backend.audio.audio_service "
            "<audio_file>"
        )

        sys.exit(1)

    audio_file = sys.argv[1]

    result = process_audio(
        audio_file
    )

    print(
        json.dumps(
            result,
            indent=2,
        )
    )