import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from pydantic import BaseModel
from sqlmodel import Column, Field, JSON, SQLModel, create_engine


load_dotenv()


# ============================================================
# PYDANTIC CONTRACTS
# ============================================================

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


# ============================================================
# SQLMODEL TABLES
# ============================================================

class Problem(SQLModel, table=True):
    id: str = Field(primary_key=True)
    title: str
    description: str

    tags: List[str] = Field(
        sa_column=Column(JSON)
    )

    rubric: Dict[str, Any] = Field(
        sa_column=Column(JSON)
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class InterviewSession(SQLModel, table=True):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )

    problem_id: str = Field(
        foreign_key="problem.id"
    )

    transcript_text: Optional[str] = None

    word_timestamps: List[Dict[str, Any]] = Field(
        default=[],
        sa_column=Column(JSON)
    )

    duration_seconds: Optional[float] = None

    wpm: Optional[int] = None

    hesitation_count: Optional[int] = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class EvaluationResult(SQLModel, table=True):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )

    # IMPORTANT:
    # Shared Supabase interviewsession.id is INTEGER
    session_id: int = Field(
        foreign_key="interviewsession.id"
    )

    extracted_entities: Dict[str, Any] = Field(
        default={},
        sa_column=Column(JSON)
    )

    strategy_similarity: float = Field(
        default=0.0
    )

    passed_time_complexity: bool = Field(
        default=False
    )

    passed_edge_cases: bool = Field(
        default=False
    )

    final_score: float = Field(
        default=0.0
    )

    ai_coaching: Dict[str, Any] = Field(
        default={},
        sa_column=Column(JSON)
    )


# ============================================================
# DATABASE CONNECTION
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL not found in environment variables"
    )


engine = create_engine(
    DATABASE_URL,
    echo=True
)


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

def create_db_and_tables():
    print("Creating database tables...")

    SQLModel.metadata.create_all(engine)

    print("Tables created successfully!")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    create_db_and_tables()