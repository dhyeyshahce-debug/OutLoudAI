from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .evaluation_api import router as evaluation_router


app = FastAPI(
    title="OutLoudAI API",
    description="OutLoudAI evaluation backend",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(evaluation_router)


@app.get("/")
def root():
    return {
        "message": "OutLoudAI API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }