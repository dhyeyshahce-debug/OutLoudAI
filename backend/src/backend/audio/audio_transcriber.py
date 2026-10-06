from __future__ import annotations

import io
import os
import tempfile
from functools import lru_cache

from pydub import AudioSegment
from faster_whisper import WhisperModel


@lru_cache(maxsize=1)
def get_whisper_model() -> WhisperModel:
    """
    Load the Whisper model only once.

    Using a cached singleton prevents loading the model
    every time an audio file is processed.
    """

    print("Loading Whisper model...")

    model = WhisperModel(
        "small.en",
        device="cpu",
        compute_type="int8",
    )

    print("Whisper model loaded.")

    return model


def normalize_audio(
    audio_path_or_bytes: str | bytes,
) -> tuple[bytes, float]:
    """
    Convert input audio to:
    - WAV
    - Mono
    - 16 kHz

    Returns:
        (wav_bytes, duration_seconds)
    """

    if isinstance(audio_path_or_bytes, bytes):
        audio = AudioSegment.from_file(
            io.BytesIO(audio_path_or_bytes)
        )
    else:
        audio = AudioSegment.from_file(
            audio_path_or_bytes
        )

    if len(audio) == 0:
        return b"", 0.0

    # Convert to mono
    audio = audio.set_channels(1)

    # Convert to 16 kHz
    audio = audio.set_frame_rate(16000)

    output = io.BytesIO()

    audio.export(
        output,
        format="wav",
    )

    return output.getvalue(), len(audio) / 1000.0


def transcribe_audio(
    audio_path_or_bytes: str | bytes,
) -> dict:
    """
    Normalize audio and transcribe it using Whisper.

    Returns:
        {
            "text": "...",
            "duration_seconds": 10.5,
            "segments": [...],
            "status": "SUCCESS"
        }
    """

    try:
        wav_bytes, duration = normalize_audio(
            audio_path_or_bytes
        )

        # Empty audio
        if not wav_bytes or duration <= 0:
            return {
                "text": "",
                "duration_seconds": 0.0,
                "segments": [],
                "status": "SILENCE_DETECTED",
            }

        model = get_whisper_model()

        # Whisper works with a temporary WAV file
        with tempfile.NamedTemporaryFile(
            suffix=".wav",
            delete=False,
        ) as temp_file:

            temp_file.write(wav_bytes)
            temp_audio_path = temp_file.name

        try:

            segments, info = model.transcribe(
                temp_audio_path,
                language="en",
                beam_size=5,
                word_timestamps=True,
                vad_filter=True,
            )

            transcript_parts = []
            segment_data = []

            for segment in segments:

                text = segment.text.strip()

                if text:
                    transcript_parts.append(text)

                words = []

                if segment.words:

                    for word in segment.words:

                        words.append(
                            {
                                "word": word.word,
                                "start": word.start,
                                "end": word.end,
                            }
                        )

                segment_data.append(
                    {
                        "start": segment.start,
                        "end": segment.end,
                        "text": text,
                        "words": words,
                    }
                )

            transcript = " ".join(
                transcript_parts
            ).strip()

            if not transcript:
                return {
                    "text": "",
                    "duration_seconds": round(
                        duration,
                        3,
                    ),
                    "segments": segment_data,
                    "status": "SILENCE_DETECTED",
                }

            return {
                "text": transcript,
                "duration_seconds": round(
                    duration,
                    3,
                ),
                "segments": segment_data,
                "status": "SUCCESS",
            }

        finally:

            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)

    except Exception as exc:

        return {
            "text": "",
            "duration_seconds": 0.0,
            "segments": [],
            "status": f"ERROR: {str(exc)}",
        }


if __name__ == "__main__":

    import sys

    if len(sys.argv) < 2:

        print(
            "Usage:\n"
            "uv run python -m "
            "backend.audio.audio_transcriber "
            "<audio_file>"
        )

        sys.exit(1)

    result = transcribe_audio(
        sys.argv[1]
    )

    print("\n========== TRANSCRIPT ==========")
    print(result["text"])

    print("\n========== STATUS ==========")
    print(result["status"])

    print("\n========== DURATION ==========")
    print(result["duration_seconds"])