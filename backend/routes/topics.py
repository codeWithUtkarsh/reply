from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import db
from logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)


class TopicCreateRequest(BaseModel):
    topic_name: str
    project_id: str
    topic_desc: Optional[str] = None


class TopicResponse(BaseModel):
    id: str
    topic_name: str
    topic_desc: Optional[str]
    project_id: str
    created_at: str


@router.post("/", response_model=TopicResponse)
async def create_topic(request: TopicCreateRequest):
    """Create a new topic within a project"""
    logger.info(f"=== Creating topic: {request.topic_name} for project: {request.project_id} ===")

    try:
        topic = await db.create_topic(
            topic_name=request.topic_name,
            project_id=request.project_id,
            topic_desc=request.topic_desc
        )

        if not topic:
            raise HTTPException(status_code=500, detail="Failed to create topic")

        logger.info(f"✅ Topic created: {topic['id']}")

        return TopicResponse(
            id=topic['id'],
            topic_name=topic['topic_name'],
            topic_desc=topic.get('topic_desc'),
            project_id=topic['project_id'],
            created_at=topic['created_at']
        )

    except Exception as e:
        logger.error(f"Error creating topic: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error creating topic")


@router.get("/project/{project_id}")
async def get_topics_by_project(project_id: str):
    """Get all topics for a specific project"""
    logger.info(f"=== Fetching topics for project: {project_id} ===")

    try:
        topics = await db.get_topics_by_project(project_id)

        logger.info(f"Found {len(topics)} topics for project {project_id}")

        return {
            "topics": topics,
            "count": len(topics)
        }

    except Exception as e:
        logger.error(f"Error fetching topics: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error fetching topics")


@router.get("/{topic_id}")
async def get_topic(topic_id: str):
    """Get a specific topic by ID"""
    logger.info(f"=== Fetching topic: {topic_id} ===")

    try:
        topic = await db.get_topic(topic_id)

        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")

        return topic

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching topic: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error fetching topic")


@router.get("/{topic_id}/videos")
async def get_videos_by_topic(topic_id: str):
    """Get all videos for a specific topic"""
    logger.info(f"=== Fetching videos for topic: {topic_id} ===")

    try:
        videos = await db.get_videos_by_topic(topic_id)

        logger.info(f"Found {len(videos)} videos for topic {topic_id}")

        return {
            "videos": videos,
            "count": len(videos)
        }

    except Exception as e:
        logger.error(f"Error fetching videos for topic: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error fetching videos")
