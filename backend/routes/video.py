from fastapi import APIRouter, HTTPException
from models import VideoProcessRequest, VideoProcessResponse
from services.video_processor import video_processor
from services.whisper_service import whisper_service
from services.question_generator import question_generator
from database import db
from config import settings

router = APIRouter()


@router.post("/process", response_model=VideoProcessResponse)
async def process_video(request: VideoProcessRequest):
    """
    Process a video URL:
    1. Extract video information
    2. Transcribe video
    3. Generate flashcard questions
    """
    try:
        # Extract video info
        video_info = video_processor.extract_video_info(request.video_url)
        video_id = video_processor.generate_video_id(request.video_url)

        # Check if video duration exceeds limit
        if video_info['duration'] > settings.max_video_duration:
            raise HTTPException(
                status_code=400,
                detail=f"Video duration exceeds maximum allowed "
                      f"({settings.max_video_duration} seconds)"
            )

        title = request.title or video_info['title']

        # Transcribe video (or use simulated transcription)
        transcript = await whisper_service.transcribe_video(
            request.video_url,
            video_info['duration']
        )

        # Generate flashcards
        flashcards = await question_generator.generate_flashcards(
            transcript.segments,
            interval=settings.flashcard_interval
        )

        # Store video in database
        await db.store_video(
            video_id=video_id,
            title=title,
            duration=video_info['duration'],
            transcript=transcript.dict(),
            url=request.video_url,
            project_id=request.project_id
        )

        # Store questions
        questions_data = [
            {
                **fc.question.dict(),
                "show_at_timestamp": fc.show_at_timestamp
            }
            for fc in flashcards
        ]
        await db.store_questions(video_id, questions_data)

        return VideoProcessResponse(
            video_id=video_id,
            title=title,
            duration=video_info['duration'],
            transcript=transcript,
            flashcards=flashcards,
            message="Video processed successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")


@router.get("/{video_id}")
async def get_video(video_id: str):
    """Get video information and flashcards"""
    try:
        video = await db.get_video(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        questions = await db.get_questions(video_id)

        return {
            "video_id": video_id,
            "title": video['title'],
            "duration": video['video_length'],
            "url": video['url'],
            "transcript": video['transcript'],
            "questions": questions
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{video_id}/direct-url")
async def get_video_direct_url(video_id: str):
    """Get direct playable video URL"""
    try:
        video = await db.get_video(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        direct_url = video_processor.get_video_url(video['url'])

        return {
            "video_id": video_id,
            "direct_url": direct_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
