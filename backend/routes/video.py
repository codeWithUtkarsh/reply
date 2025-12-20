from fastapi import APIRouter, HTTPException
from models import VideoProcessRequest, VideoProcessResponse
from services.video_processor import video_processor
from services.whisper_service import whisper_service
from services.question_generator import question_generator
from database import db
from config import settings
from logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post("/process", response_model=VideoProcessResponse)
async def process_video(request: VideoProcessRequest):
    """
    Process a video URL:
    1. Extract video information
    2. Transcribe video
    3. Generate flashcard questions
    """
    logger.info(f"=== Processing video request ===")
    logger.info(f"Video URL: {request.video_url}")
    logger.info(f"Title: {request.title}")
    logger.info(f"Project ID: {request.project_id}")

    try:
        # Extract video info
        logger.info("Extracting video information...")
        video_info = video_processor.extract_video_info(request.video_url)
        video_id = video_processor.generate_video_id(request.video_url)
        logger.info(f"Video ID: {video_id}, Duration: {video_info['duration']}s")

        # Check if video duration exceeds limit
        if video_info['duration'] > settings.max_video_duration:
            logger.warning(f"Video duration ({video_info['duration']}s) exceeds limit ({settings.max_video_duration}s)")
            raise HTTPException(
                status_code=400,
                detail=f"Video duration exceeds maximum allowed "
                      f"({settings.max_video_duration} seconds)"
            )

        title = request.title or video_info['title']
        logger.info(f"Video title: {title}")

        # Transcribe video (or use simulated transcription)
        logger.info("Starting video transcription...")
        transcript = await whisper_service.transcribe_video(
            request.video_url,
            video_info['duration']
        )
        logger.info(f"Transcription completed. Segments: {len(transcript.segments)}")

        # Generate flashcards
        logger.info("Generating flashcards...")
        flashcards = await question_generator.generate_flashcards(
            transcript.segments,
            interval=settings.flashcard_interval
        )
        logger.info(f"Generated {len(flashcards)} flashcards")

        # Store video in database
        logger.info(f"Storing video in database (ID: {video_id}, Project ID: {request.project_id})...")
        await db.store_video(
            video_id=video_id,
            title=title,
            duration=video_info['duration'],
            transcript=transcript.dict(),
            url=request.video_url,
            project_id=request.project_id
        )
        logger.info("Video stored successfully in database")

        # Store questions
        logger.info(f"Storing {len(flashcards)} questions in database...")
        questions_data = [
            {
                **fc.question.dict(),
                "show_at_timestamp": fc.show_at_timestamp
            }
            for fc in flashcards
        ]
        await db.store_questions(video_id, questions_data)
        logger.info("Questions stored successfully")

        logger.info(f"=== Video processing completed successfully for video ID: {video_id} ===")

        return VideoProcessResponse(
            video_id=video_id,
            title=title,
            duration=video_info['duration'],
            transcript=transcript,
            flashcards=flashcards,
            message="Video processed successfully"
        )

    except HTTPException as he:
        logger.error(f"HTTP Exception in process_video: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in process_video: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")


@router.get("/{video_id}")
async def get_video(video_id: str):
    """Get video information and flashcards"""
    logger.info(f"=== Fetching video: {video_id} ===")

    try:
        video = await db.get_video(video_id)
        if not video:
            logger.warning(f"Video not found: {video_id}")
            raise HTTPException(status_code=404, detail="Video not found")

        logger.info(f"Video found: {video['title']}")

        logger.info("Fetching questions for video...")
        questions = await db.get_questions(video_id)
        logger.info(f"Found {len(questions)} questions")

        logger.info(f"=== Successfully fetched video: {video_id} ===")

        return {
            "video_id": video_id,
            "title": video['title'],
            "duration": video['video_length'],
            "url": video['url'],
            "transcript": video['transcript'],
            "questions": questions
        }
    except HTTPException as he:
        logger.error(f"HTTP Exception in get_video: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_video (ID: {video_id}): {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{video_id}/direct-url")
async def get_video_direct_url(video_id: str):
    """Get direct playable video URL"""
    logger.info(f"=== Fetching direct URL for video: {video_id} ===")

    try:
        video = await db.get_video(video_id)
        if not video:
            logger.warning(f"Video not found: {video_id}")
            raise HTTPException(status_code=404, detail="Video not found")

        logger.info(f"Generating direct URL for: {video['url']}")
        direct_url = video_processor.get_video_url(video['url'])
        logger.info(f"Direct URL generated successfully")

        logger.info(f"=== Successfully fetched direct URL for video: {video_id} ===")

        return {
            "video_id": video_id,
            "direct_url": direct_url
        }
    except HTTPException as he:
        logger.error(f"HTTP Exception in get_video_direct_url: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_video_direct_url (ID: {video_id}): {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
