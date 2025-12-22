from fastapi import APIRouter, HTTPException
from database import db
from logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """
    Delete a project and all associated videos.
    Videos are only deleted if they're not linked to other projects.
    """
    logger.info(f"=== Deleting project: {project_id} ===")

    try:
        # Delete the project (this will cascade to videos if they're not used elsewhere)
        result = await db.delete_project(project_id)

        logger.info(f"=== Project deleted successfully: {project_id} ===")
        return result

    except Exception as e:
        logger.error(
            f"Unexpected error in delete_project ({project_id}): {type(e).__name__}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Error deleting project")
