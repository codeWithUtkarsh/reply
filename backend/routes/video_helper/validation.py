from typing import Dict
from logging_config import get_logger
from fastapi import HTTPException
from config import settings

logger = get_logger(__name__)

def validate(video_info: Dict, video_id: str) -> bool:
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

    # Validate language - if language is None or empty, assume English
    if language is None or language == "":
        logger.warning(
            f"Video ID: {video_id} - Language metadata not available, assuming English"
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