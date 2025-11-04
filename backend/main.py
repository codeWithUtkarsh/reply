from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes import video, questions, quiz, reports, notes

app = FastAPI(
    title="Preply Video Learning API",
    description="API for video-based learning with AI-generated questions",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(video.router, prefix="/api/video", tags=["video"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])


@app.get("/")
async def root():
    return {
        "message": "Preply Video Learning API",
        "status": "active",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.backend_port)
