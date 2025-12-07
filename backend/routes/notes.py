from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from services.notes_generator import NotesGenerator
from typing import Optional, List, Dict, Any


router = APIRouter()
notes_generator = NotesGenerator()


class GenerateNotesRequest(BaseModel):
    video_id: str


class UpdateNotesRequest(BaseModel):
    title: str
    sections: List[Dict[str, Any]]


@router.post("/generate")
async def generate_notes(request: GenerateNotesRequest):
    """Generate comprehensive notes with diagrams for a video"""
    try:
        # Get video data
        video = await db.get_video(request.video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        # Check if notes already exist
        existing_notes = await db.get_notes_by_video(request.video_id)
        if existing_notes:
            return {
                "message": "Notes already exist for this video",
                "notes": existing_notes
            }

        # Parse transcript
        import json
        transcript_data = json.loads(video['transcript']) if isinstance(video['transcript'], str) else video['transcript']
        transcript_text = transcript_data.get('full_text', '')

        print(f"Generating notes for video: {video['title']}")
        print(f"Transcript length: {len(transcript_text)}")

        # Generate notes
        notes_data = await notes_generator.generate_notes(
            transcript_text=transcript_text,
            video_title=video['title']
        )

        print(f"Notes generated successfully, notes_id: {notes_data.get('notes_id')}")

        # Add video_id to notes
        notes_data['video_id'] = request.video_id

        # Store notes
        stored_notes = await db.store_notes(notes_data)

        print(f"Notes stored successfully")

        return {
            "message": "Notes generated successfully",
            "notes": stored_notes
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error generating notes: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/{video_id}")
async def get_notes(video_id: str):
    """Get notes for a video"""
    try:
        notes = await db.get_notes_by_video(video_id)
        if not notes:
            raise HTTPException(status_code=404, detail="Notes not found for this video")
        
        return {"notes": notes}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-id/{notes_id}")
async def get_notes_by_id(notes_id: str):
    """Get notes by notes_id"""
    try:
        notes = await db.get_notes_by_id(notes_id)
        if not notes:
            raise HTTPException(status_code=404, detail="Notes not found")

        return {"notes": notes}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{notes_id}")
async def update_notes(notes_id: str, request: UpdateNotesRequest):
    """Update existing notes"""
    try:
        # Check if notes exist
        existing_notes = await db.get_notes_by_id(notes_id)
        if not existing_notes:
            raise HTTPException(status_code=404, detail="Notes not found")

        # Update notes
        import json
        updated_notes = await db.update_notes(
            notes_id=notes_id,
            title=request.title,
            sections=request.sections
        )

        return {
            "message": "Notes updated successfully",
            "notes": updated_notes
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error updating notes: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))
