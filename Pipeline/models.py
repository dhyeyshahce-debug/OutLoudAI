from sqlmodel import SQLModel, Field
from typing import Optional

# 1. Define the Database Table
class InterviewSession(SQLModel, table=True):
    # Field(primary_key=True) means this is the unique ID for every row
    id: Optional[int] = Field(default=None, primary_key=True)
    
    user_id: str
    problem_id: str
    
    # We will store the AI's results here
    transcript: Optional[str] = None
    technical_score: Optional[int] = None
    feedback_json: Optional[str] = None # Databases store JSON best as text strings