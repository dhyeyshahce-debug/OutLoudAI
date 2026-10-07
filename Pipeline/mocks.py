import asyncio

# The "async" keyword means this function can pause and wait (like waiting for a file to read)
# without freezing the rest of the server.

async def mock_track_3_stt(audio_bytes: bytes):
    # Pretend it took 1 second to process the audio
    await asyncio.sleep(1) 
    return {
        "transcript_text": "I will use a hash map to find the complement...", 
        "wpm": 140
    }

async def mock_track_1_vector(transcript: str, problem_id: str):
    await asyncio.sleep(0.5)
    return {
        "matched_tier": "Tier 1", 
        "similarity_score": 0.88, 
        "entities": ["hash map"]
    }

async def mock_track_2_llm(similarity_score: float, entities: list):
    await asyncio.sleep(1.5)
    return {
        "strengths": ["Identified optimal data structure"],
        "misses": ["Forgot to mention empty array edge case"],
        "hint": "What happens if the input array has no elements?"
    }