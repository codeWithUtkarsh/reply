from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes import video, questions, quiz, reports, notes
from logging_config import setup_logging, get_logger
import time

# Initialize logging
setup_logging()
logger = get_logger(__name__)

app = FastAPI(
    title="Preply Video Learning API",
    description="API for video-based learning with AI-generated questions",
    version="1.0.0"
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    # Log incoming request
    logger.info(f"→ {request.method} {request.url.path}")

    # Process request
    response = await call_next(request)

    # Log response
    duration = time.time() - start_time
    logger.info(f"← {request.method} {request.url.path} - Status: {response.status_code} - Duration: {duration:.3f}s")

    return response

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


@app.on_event("startup")
async def startup_event():
    logger.info("=" * 80)
    logger.info("🚀 Preply Video Learning API Starting...")
    logger.info(f"Version: 1.0.0")
    logger.info(f"Port: {settings.backend_port}")
    logger.info(f"CORS Origins: {settings.cors_origins}")
    logger.info("=" * 80)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("=" * 80)
    logger.info("🛑 Preply Video Learning API Shutting Down...")
    logger.info("=" * 80)


@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {
        "message": "Preply Video Learning API",
        "status": "active",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on http://0.0.0.0:{settings.backend_port}")
    uvicorn.run(app, host="0.0.0.0", port=settings.backend_port)
