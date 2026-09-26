import os
from dotenv import load_dotenv
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from sqlmodel import Field, SQLModel, create_engine, Column, JSON
from datetime import datetime
import uuid

load_dotenv()
# --- PYDANTIC CONTRACTS (Validation for JSON Columns) ---

class ApproachSchema(BaseModel):
    tier: str
    strategy_phrases: List[str]
    expected_time: str
    expected_space: str
    is_optimal: bool
    hint: Optional[str] = None

class RubricSchema(BaseModel):
    approaches: List[ApproachSchema]
    mandatory_edge_cases: List[str]

# --- SQLMODEL TABLES (PostgreSQL Database Schema) ---

class Problem(SQLModel, table=True):
    id: str = Field(primary_key=True) # e.g., 'two-sum'
    title: str
    description: str
    tags: List[str] = Field(sa_column=Column(JSON))
    
    # Validated by RubricSchema before insertion
    rubric: Dict[str, Any] = Field(sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InterviewSession(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    problem_id: str = Field(foreign_key="problem.id")
    transcript_text: Optional[str] = None
    
    # Stores Whisper's output natively
    word_timestamps: List[Dict[str, Any]] = Field(default=[], sa_column=Column(JSON))
    duration_seconds: Optional[float] = None
    wpm: Optional[int] = None
    hesitation_count: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EvaluationResult(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="interviewsession.id")
    extracted_entities: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    strategy_similarity: float = Field(default=0.0)
    passed_time_complexity: bool = Field(default=False)
    passed_edge_cases: bool = Field(default=False)
    final_score: float = Field(default=0.0)
    
    # Stores Gemini API feedback natively
    ai_coaching: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))

# --- DATABASE CONNECTION ---

# IMPORTANT: Replace 'user' and 'password' with your PostgreSQL credentials
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in environment variables")

engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    print("Creating database tables...")
    SQLModel.metadata.create_all(engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    create_db_and_tables()