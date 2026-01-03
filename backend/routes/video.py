from fastapi import APIRouter, HTTPException, BackgroundTasks
from models import VideoProcessRequest, VideoProcessResponse
from services.video_processor import video_processor
from services.whisper_service import whisper_service
from services.question_generator import question_generator
from database import db
from config import settings
from logging_config import get_logger
from .video_helper import validation
import json


router = APIRouter()
logger = get_logger(__name__)


# Background task for async video processing
async def process_video_background(video_id: str, video_url: str, title: str, user_id: str = None, project_id: str = None):
    """Background task to transcribe video and generate flashcards with batch processing for long videos"""
    try:
        logger.info(f"=== Background processing started for video: {video_id} ===")

        # Get video duration
        video = await db.get_video(video_id)
        if not video:
            raise Exception("Video not found in database")

        duration = video["video_length"]
        BATCH_THRESHOLD = 600  # 10 minutes
        BATCH_SIZE = 600  # 10 minutes per batch

        # Check if batch processing is needed
        if duration > BATCH_THRESHOLD:
            logger.info(f"Video duration ({duration}s) > {BATCH_THRESHOLD}s - Using batch processing")
            await process_video_in_batches(video_id, video_url, title, duration, BATCH_SIZE)
        else:
            logger.info(f"Video duration ({duration}s) <= {BATCH_THRESHOLD}s - Using standard processing")
            await process_video_standard(video_id, video_url, title, duration)

        # Deduct transcription credits after successful processing
        if user_id:
            import math
            credits_to_deduct = math.ceil(duration / 60)  # 1 credit per minute, rounded up
            logger.info(f"Deducting {credits_to_deduct} transcription credits for user {user_id}")
            result = await db.deduct_transcription_credits(
                user_id,
                credits_to_deduct,
                video_id=video_id,
                project_id=project_id,
                description=f"Transcription of video: {title}",
                metadata={"duration_seconds": duration, "video_title": title}
            )
            if not result:
                logger.warning(f"Failed to deduct credits for user {user_id}, but video processing completed")

        logger.info(f"=== Background processing completed for video: {video_id} ===")

    except Exception as e:
        logger.error(f"Background processing failed for video {video_id}: {str(e)}", exc_info=True)
        await db.update_video_status(video_id, "failed", error_message=str(e))


async def process_video_standard(video_id: str, video_url: str, title: str, duration: float):
    """Standard processing for videos <= 10 minutes"""
    # Update status to transcribing
    await db.update_video_status(video_id, "transcribing")

    # Transcribe video
    logger.info(f"Starting transcription for video: {video_id}")
    transcript = await whisper_service.transcribe_video(video_url, duration)
    logger.info(f"Transcription completed. Segments: {len(transcript.segments)}")

    # Store transcript
    await db.update_video_transcript(video_id, transcript.dict())

    # Update status to generating flashcards
    await db.update_video_status(video_id, "generating_flashcards")

    # Generate flashcards
    logger.info("Generating flashcards with context...")
    flashcards = await question_generator.generate_flashcards(
        transcript.segments,
        interval=settings.flashcard_interval,
        video_title=title
    )
    logger.info(f"Generated {len(flashcards)} flashcards")

    # Store flashcards
    questions_data = [
        {
            **fc.question.dict(),
            "show_at_timestamp": fc.show_at_timestamp,
        }
        for fc in flashcards
    ]
    await db.store_questions(video_id, questions_data)

    # Mark as completed
    await db.update_video_status(video_id, "completed")


async def process_video_in_batches(video_id: str, video_url: str, title: str, duration: float, batch_size: int):
    """Process long videos in batches (10-minute segments)"""
    # Create segments
    segments = []
    start = 0
    while start < duration:
        end = min(start + batch_size, duration)
        segments.append((start, end))
        start = end

    total_batches = len(segments)
    logger.info(f"Processing video in {total_batches} batches of {batch_size}s each")

    # Collect all transcript segments from all batches
    all_transcript_segments = []
    all_transcript_text_parts = []

    # Process each batch
    for batch_num, (batch_start, batch_end) in enumerate(segments, 1):
        logger.info(f"=== Processing batch {batch_num}/{total_batches} ({batch_start}s-{batch_end}s) ===")

        # Update status to show batch progress
        await db.update_video_status(
            video_id,
            f"transcribing_batch",
            batch_current=batch_num,
            batch_total=total_batches
        )

        # Transcribe this batch only
        logger.info(f"Transcribing segment {batch_start}s - {batch_end}s")
        batch_transcript = await whisper_service.transcribe_video(
            video_url,
            duration,
            start_time=batch_start,
            end_time=batch_end
        )
        logger.info(f"Batch {batch_num} transcription completed. Segments: {len(batch_transcript.segments)}")

        # Accumulate transcript segments for final storage
        all_transcript_segments.extend(batch_transcript.segments)
        all_transcript_text_parts.append(batch_transcript.full_text)

        # Update status to generating flashcards for this batch
        await db.update_video_status(
            video_id,
            f"generating_flashcards_batch",
            batch_current=batch_num,
            batch_total=total_batches
        )

        # Generate flashcards for this batch
        logger.info(f"Generating flashcards for batch {batch_num}...")
        flashcards = await question_generator.generate_flashcards(
            batch_transcript.segments,
            interval=settings.flashcard_interval,
            video_title=f"{title} (Part {batch_num}/{total_batches})"
        )
        logger.info(f"Batch {batch_num}: Generated {len(flashcards)} flashcards")

        # Store flashcards immediately (available to frontend!)
        questions_data = [
            {
                **fc.question.dict(),
                "show_at_timestamp": fc.show_at_timestamp,
            }
            for fc in flashcards
        ]
        await db.store_questions(video_id, questions_data)

        logger.info(f"Batch {batch_num}/{total_batches} completed and flashcards stored")

    # All batches complete - store the complete transcript
    logger.info(f"Storing complete transcript with {len(all_transcript_segments)} total segments")
    complete_transcript = {
        "segments": [seg.dict() for seg in all_transcript_segments],
        "full_text": " ".join(all_transcript_text_parts),
        "duration": duration
    }
    await db.update_video_transcript(video_id, complete_transcript)

    # Mark video as completed
    await db.update_video_status(video_id, "completed", batch_current=0, batch_total=0)
    logger.info(f"All {total_batches} batches processed successfully")


@router.post("/process-async")
async def process_video_async(request: VideoProcessRequest, background_tasks: BackgroundTasks):
    """
    Process a video asynchronously:
    1. Extract video information (fast)
    2. Store basic video info
    3. Return immediately with video_id
    4. Process transcription and flashcards in background
    """
    logger.info("=== Async video processing request ===")
    logger.info(f"Video URL: {request.video_url}")
    logger.info(f"Title: {request.title}")
    logger.info(f"Project ID: {request.project_id}")
    logger.info(f"User ID: {request.user_id}")

    try:
        video_id = video_processor.get_video_id(request.video_url)
        await validation.validate_video_language(video_id)

        # Extract video metadata (fast operation)
        logger.info("Extracting video information...")
        video_info = await video_processor.extract_video_info_async(request.video_url)

        duration = video_info.get("duration")
        validation.validate_video_info(video_info, video_id)


        # Check transcription credits before processing (only for new videos)
        if request.user_id:
            import math
            credits_required = math.ceil(duration / 60)  # 1 credit per minute, rounded up
            logger.info(f"Credits required for transcription: {credits_required}")

            has_credits, current_credits = await db.check_transcription_credits(request.user_id, credits_required)

            if not has_credits:
                logger.warning(f"Insufficient transcription credits for user {request.user_id}: {current_credits} < {credits_required}")
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "Insufficient transcription credits",
                        "required": credits_required,
                        "available": current_credits,
                        "message": f"You need {credits_required} transcription credits but only have {current_credits}. Each minute of video requires 1 credit."
                    }
                )

            logger.info(f"User {request.user_id} has sufficient credits: {current_credits} >= {credits_required}")

        # Check existing video
        existing_video = await db.get_video(video_id)

        if existing_video:
            logger.info(f"✅ Video already exists - ID: {video_id}")

            if request.project_id:
                await db.link_video_to_project(video_id, request.project_id)

            # Return existing video info
            existing_questions = await db.get_questions(video_id)

            transcript_data = (
                json.loads(existing_video["transcript"])
                if isinstance(existing_video.get("transcript"), str)
                else existing_video.get("transcript")
            )

            return {
                "video_id": video_id,
                "title": existing_video["title"],
                "duration": existing_video["video_length"],
                "url": existing_video["url"],
                "processing_status": existing_video.get("processing_status", "completed"),
                "transcript": transcript_data,
                "questions": existing_questions,
                "message": "Video already processed"
            }


        title = video_info.get("title")
        logger.info(f"Video title: {title}")

        # Store video with initial processing status
        logger.info(f"Storing initial video record (ID: {video_id})")
        await db.store_video_initial(
            video_id=video_id,
            title=title,
            duration=duration,
            url=request.video_url,
            project_id=request.project_id,
            processing_status="processing"
        )

        # Add background task for transcription and flashcard generation
        background_tasks.add_task(process_video_background, video_id, request.video_url, title, request.user_id, request.project_id)

        logger.info(f"=== Video {video_id} queued for background processing ===")

        # Return immediately with basic info
        return {
            "video_id": video_id,
            "title": title,
            "duration": duration,
            "url": request.video_url,
            "processing_status": "processing",
            "message": "Video processing started in background"
        }

    except HTTPException:
        logger.warning("HTTP exception in process_video_async", exc_info=True)
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in process_video_async: {type(e).__name__}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Error processing video")

@router.get("/{video_id}/status")
async def get_video_status(video_id: str):
    """Get video processing status"""
    logger.info(f"=== Fetching status for video: {video_id} ===")

    try:
        video = await db.get_video(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        questions = await db.get_questions(video_id)
        question_count = len(questions) if questions else 0

        return {
            "video_id": video_id,
            "processing_status": video.get("processing_status", "completed"),
            "error_message": video.get("error_message"),
            "has_transcript": video.get("transcript") is not None,
            "flashcard_count": question_count,
            "batch_current": video.get("batch_current", 0),
            "batch_total": video.get("batch_total", 0),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in get_video_status ({video_id}): {type(e).__name__}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Error fetching video status")


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
            if isinstance(video.get("transcript"), str) and video.get("transcript")
            else video.get("transcript")
        )

        return {
            "video_id": video_id,
            "title": video["title"],
            "duration": video["video_length"],
            "url": video["url"],
            "processing_status": video.get("processing_status", "completed"),
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

        direct_url = video_processor.get_video_url(video_id)

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


@router.delete("/{video_id}")
async def delete_video(video_id: str, project_id: str = None):
    """
    Delete a video from a project or completely.
    If project_id is provided, only removes the link.
    If no project_id, deletes the video and all associated data.
    """
    logger.info(f"=== Deleting video: {video_id}, project_id: {project_id} ===")

    try:
        # Check if video exists
        video = await db.get_video(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        # Delete the video
        result = await db.delete_video(video_id, project_id)

        logger.info(f"=== Video deleted successfully: {video_id} ===")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in delete_video ({video_id}): {type(e).__name__}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Error deleting video")
