from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
import json

# Import the files we just created
from database import engine, create_db_and_tables, get_session
from models import InterviewSession
from mocks import mock_track_3_stt, mock_track_1_vector, mock_track_2_llm

app = FastAPI(title="AI Interview Hub")

# CORS setup: This tells the backend "It is safe to accept requests from the Next.js frontend"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace "*" with your frontend's actual URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Run this function exactly once when the server starts
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# THE MASTER ENDPOINT
@app.post("/api/v1/evaluate-audio")
async def evaluate_audio(
    audio_file: UploadFile = File(...),
    problem_id: str = Form(...),
    user_id: str = Form(...),
    db: Session = Depends(get_session) # Automatically opens a DB connection
):
    try:
        # 1. Read the audio file into memory
        audio_bytes = await audio_file.read()
        
        # 2. Track 3: Speech to Text
        stt_result = await mock_track_3_stt(audio_bytes)
        transcript = stt_result["transcript_text"]
        
        # 3. Track 1: Vector Scoring
        vector_result = await mock_track_1_vector(transcript, problem_id)
        
        # 4. Track 2: LLM Coaching
        llm_feedback = await mock_track_2_llm(
            vector_result["similarity_score"], 
            vector_result["entities"]
        )
        
        # 5. Database Save (Transaction Management)
        # We create a new row in python...
        new_session = InterviewSession(
            user_id=user_id,
            problem_id=problem_id,
            transcript=transcript,
            technical_score=int(vector_result["similarity_score"] * 100),
            feedback_json=json.dumps(llm_feedback) # convert python dictionary to JSON string
        )
        
        db.add(new_session) # Stage the row
        db.commit()         # Actually save it to the file
        db.refresh(new_session) # Get the newly generated ID back from the database
        
        # 6. Return response to Frontend
        return {
            "status": "success",
            "session_id": new_session.id,
            "transcript": transcript,
            "technical_score": new_session.technical_score,
            "feedback": llm_feedback
        }
        
    except Exception as e:
        # If ANYTHING fails above, undo any partial database saves
        db.rollback()
        # Tell the frontend there was a server crash
        raise HTTPException(status_code=500, detail=str(e))