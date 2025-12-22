from fastapi import APIRouter, HTTPException
from models import VideoProcessRequest, VideoProcessResponse
from services.video_processor import video_processor
from services.whisper_service import whisper_service
from services.question_generator import question_generator
from database import db
from config import settings
from logging_config import get_logger
import json

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
    logger.info("=== Processing video request ===")
    logger.info(f"Video URL: {request.video_url}")
    logger.info(f"Title: {request.title}")
    logger.info(f"Project ID: {request.project_id}")

    try:
        # -----------------------------------------------------
        # Extract video metadata
        # -----------------------------------------------------
        logger.info("Extracting video information...")
        video_info = video_processor.extract_video_info(request.video_url)
        video_id = video_processor.generate_video_id(request.video_url)

        duration = video_info.get("duration")
        if duration is None:
            raise HTTPException(status_code=400, detail="Unable to determine video duration")

        logger.info(f"Video ID: {video_id}, Duration: {duration}s")

        # -----------------------------------------------------
        # Check existing video
        # -----------------------------------------------------
        existing_video = await db.get_video(video_id)

        if existing_video:
            logger.info(f"✅ Video already exists - ID: {video_id}")

            if request.project_id:
                await db.link_video_to_project(video_id, request.project_id)

            existing_questions = await db.get_questions(video_id)

            transcript_data = (
                json.loads(existing_video["transcript"])
                if isinstance(existing_video.get("transcript"), str)
                else existing_video.get("transcript")
            )

            flashcards = []
            for q in existing_questions:
                question_data = (
                    json.loads(q["question_data"])
                    if isinstance(q.get("question_data"), str)
                    else q.get("question_data")
                )
                flashcards.append({
                    "question": question_data,
                    "show_at_timestamp": question_data.get("show_at_timestamp", 0),
                })

            logger.info(
                f"=== Reused transcript and {len(flashcards)} flashcards for video ID: {video_id} ==="
            )

            return VideoProcessResponse(
                video_id=video_id,
                title=existing_video["title"],
                duration=existing_video["video_length"],
                transcript=transcript_data,
                flashcards=flashcards,
                message="Video already processed, reused existing data",
            )

        # -----------------------------------------------------
        # Validate duration
        # -----------------------------------------------------
        if duration > settings.max_video_duration:
            logger.warning(
                f"Video duration ({duration}s) exceeds limit "
                f"({settings.max_video_duration}s)"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Video duration exceeds maximum allowed ({settings.max_video_duration} seconds)",
            )

        title = request.title or video_info.get("title")
        logger.info(f"Video title: {title}")

        # -----------------------------------------------------
        # Transcription
        # -----------------------------------------------------
        logger.info("Starting video transcription...")
        transcript = await whisper_service.transcribe_video(
            request.video_url, duration
        )
        logger.info(f"Transcription completed. Segments: {len(transcript.segments)}")

        # -----------------------------------------------------
        # Flashcard generation
        # -----------------------------------------------------
        logger.info("Generating flashcards with context...")
        flashcards = await question_generator.generate_flashcards(
            transcript.segments,
            interval=settings.flashcard_interval,
            video_title=title
        )
        logger.info(f"Generated {len(flashcards)} high-quality flashcards")

        # -----------------------------------------------------
        # Persist video
        # -----------------------------------------------------
        logger.info(f"Storing video in database (ID: {video_id})")
        await db.store_video(
            video_id=video_id,
            title=title,
            duration=duration,
            transcript=transcript.dict(),
            url=request.video_url,
            project_id=request.project_id,
        )

        # -----------------------------------------------------
        # Persist questions
        # -----------------------------------------------------
        logger.info(f"Storing {len(flashcards)} questions")
        questions_data = [
            {
                **fc.question.dict(),
                "show_at_timestamp": fc.show_at_timestamp,
            }
            for fc in flashcards
        ]
        await db.store_questions(video_id, questions_data)

        logger.info(f"=== Video processing completed for ID: {video_id} ===")

        return VideoProcessResponse(
            video_id=video_id,
            title=title,
            duration=duration,
            transcript=transcript.dict(),
            flashcards=flashcards,
            message="Video processed successfully",
        )

    except HTTPException:
        logger.warning("HTTP exception in process_video", exc_info=True)
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in process_video: {type(e).__name__}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Error processing video")


@router.get("/{video_id}")
async def get_video(video_id: str):
    """Get video information and flashcards"""
    logger.info(f"=== Fetching video: {video_id} ===")

    try:
        video = await db.get_video(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        questions = await db.get_questions(video_id)

        transcript = (
            json.loads(video["transcript"])
            if isinstance(video.get("transcript"), str)
            else video.get("transcript")
        )

        return {
            "video_id": video_id,
            "title": video["title"],
            "duration": video["video_length"],
            "url": video["url"],
            "transcript": transcript,
            "questions": questions,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in get_video ({video_id}): {type(e).__name__}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Error fetching video")


@router.get("/{video_id}/direct-url")
async def get_video_direct_url(video_id: str):
    """Get direct playable video URL"""
    logger.info(f"=== Fetching direct URL for video: {video_id} ===")

    try:
        video = await db.get_video(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        direct_url = video_processor.get_video_url(video["url"])

        return {
            "video_id": video_id,
            "direct_url": direct_url,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in get_video_direct_url ({video_id}): {type(e).__name__}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Error generating direct URL")
