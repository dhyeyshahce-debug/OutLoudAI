import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session

# Load variables from .env file
load_dotenv()

# Get the database URL from .env. Older configs may use DATABASE instead of DATABASE_URL.
DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("DATABASE")
    or os.getenv("POSTGRES_URL")
)

if not DATABASE_URL:
    raise RuntimeError(
        "No database connection string found. Set DATABASE_URL (or DATABASE) in the .env file."
    )

# Make sure SQLAlchemy uses postgresql:// prefix (Fixes minor protocol variations)
DATABASE_URL = DATABASE_URL.strip()
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create the engine connected to Supabase
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production to turn off SQL logging
    pool_pre_ping=True,  # Keeps the remote connection alive automatically
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session