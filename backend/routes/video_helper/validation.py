from typing import Dict
from logging_config import get_logger
from fastapi import HTTPException
from config import settings
from youtube_transcript_api import YouTubeTranscriptApi

from services.whisper_service import whisper_service

logger = get_logger(__name__)

def validate_video_info(video_info: Dict, video_id: str) -> bool:
    duration = video_info.get("duration")
    language = video_info.get("language")
    if duration is None:
        raise HTTPException(status_code=400, detail="Unable to determine video duration")

    logger.info(f"Video ID: {video_id}, Duration: {duration}s, Language: {language}")

    # VALIDATIONS BEFORE PROCEEDING - Validate duration
    if duration > settings.max_video_duration:
        logger.warning(
            f"Video duration ({duration}s) exceeds limit ({settings.max_video_duration}s)"
        )
        raise HTTPException(
            status_code=400,
            detail=f"Video duration exceeds maximum allowed ({settings.max_video_duration} seconds)",
        )

    # Validate language - Three-stage validation approach:
    # 1. Quick 10-second sample (already done before this function)
    # 2. Metadata check (this function) - if available
    # 3. Post-transcription verification (after full transcription)
    if language is None or language == "":
        logger.info(
            f"Video ID: {video_id} - Unsupported video/language detected, We only support english language for now."
        )
    elif not language.lower().startswith("en"):
        logger.warning(
            f"Video language ({language}) not supported, contact support"
        )
        raise HTTPException(
            status_code=400,
            detail=f"Video language ({language}) not supported",
        )

    return True


async def validate_video_language(video_id: str) -> bool:
    ytt_api = YouTubeTranscriptApi()
    try:
        transcript_list = ytt_api.list(video_id)
        transcript_list.find_transcript(['en'])
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Unsupported video/language detected, We only support english language for now.")

    logger.info(f"Video language validation for ID: {video_id} ✅")
    return True