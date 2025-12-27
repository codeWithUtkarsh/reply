from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from services.notes_generator import NotesGenerator
from typing import Optional, List, Dict, Any


router = APIRouter()
notes_generator = NotesGenerator()


class GenerateNotesRequest(BaseModel):
    video_id: str
    user_id: Optional[str] = None


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

        # Check processing status
        processing_status = video.get('processing_status', 'completed')
        if processing_status != 'completed':
            raise HTTPException(
                status_code=400,
                detail=f"Video is still processing (status: {processing_status}). Please wait for processing to complete."
            )

        # Check if notes already exist
        existing_notes = await db.get_notes_by_video(request.video_id)
        if existing_notes:
            return {
                "message": "Notes already exist for this video",
                "notes": existing_notes
            }

        # Parse transcript
        import json

        # Check if video has been transcribed
        if not video['transcript']:
            raise HTTPException(
                status_code=400,
                detail="Video transcript not yet available. Please wait for video processing to complete."
            )

        transcript_data = json.loads(video['transcript']) if isinstance(video['transcript'], str) else video['transcript']

        # Handle case where transcript_data might still be None
        if not transcript_data:
            raise HTTPException(
                status_code=400,
                detail="Video transcript is empty or invalid."
            )

        transcript_text = transcript_data.get('full_text', '')

        print(f"Generating notes for video: {video['title']}")
        print(f"Transcript length: {len(transcript_text)}")

        # Check notes credits before generating
        if request.user_id:
            import math
            # 1 credit per 50,000 characters
            credits_required = math.ceil(len(transcript_text) / 50000)
            print(f"Credits required for notes generation: {credits_required}")

            has_credits, current_credits = await db.check_notes_credits(request.user_id, credits_required)

            if not has_credits:
                print(f"Insufficient notes credits for user {request.user_id}: {current_credits} < {credits_required}")
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "Insufficient notes credits",
                        "required": credits_required,
                        "available": current_credits,
                        "message": f"You need {credits_required} notes credits but only have {current_credits}. Each 50,000 characters of transcript requires 1 credit."
                    }
                )

            print(f"User {request.user_id} has sufficient credits: {current_credits} >= {credits_required}")

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

        # Deduct notes credits after successful generation
        if request.user_id:
            import math
            credits_to_deduct = math.ceil(len(transcript_text) / 50000)
            print(f"Deducting {credits_to_deduct} notes credits for user {request.user_id}")
            result = await db.deduct_notes_credits(
                request.user_id,
                credits_to_deduct,
                video_id=request.video_id,
                description=f"Notes generation for video: {video['title']}",
                metadata={"transcript_length": len(transcript_text), "video_title": video['title']}
            )
            if not result:
                print(f"Warning: Failed to deduct credits for user {request.user_id}, but notes generation completed")

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


@router.get("/user/{user_id}/all")
async def get_user_notes(user_id: str):
    """Get all notes for a user across all videos"""
    try:
        from starlette.concurrency import run_in_threadpool

        # Get all notes
        notes_result = await run_in_threadpool(
            lambda: db.client.table("notes")
            .select("notes_id, video_id, title, created_at, updated_at")
            .execute()
        )

        if not notes_result.data:
            return {"notes": []}

        # Get video information for each note
        user_notes = []
        for note in notes_result.data:
            video = await db.get_video(note['video_id'])
            if video:
                # Check if this video is accessible to the user (either standalone or in a project)
                # For now, we'll include all videos - you can add project filtering if needed

                # Get project info if video is in a project
                project_name = None
                try:
                    project_link = await run_in_threadpool(
                        lambda: db.client.table("project_videos")
                        .select("project_id")
                        .eq("video_id", note['video_id'])
                        .execute()
                    )

                    if project_link.data and len(project_link.data) > 0:
                        project_id = project_link.data[0].get('project_id')
                        if project_id:
                            project_result = await run_in_threadpool(
                                lambda: db.client.table("projects")
                                .select("project_name")
                                .eq("id", project_id)
                                .execute()
                            )
                            if project_result.data and len(project_result.data) > 0:
                                project_name = project_result.data[0].get('project_name')
                except:
                    pass

                user_notes.append({
                    'notes_id': note['notes_id'],
                    'video_id': note['video_id'],
                    'video_title': video.get('title', 'Unknown Video'),
                    'video_type': video.get('video_type', 'Unknown'),
                    'domain': video.get('domain', 'General'),
                    'project_name': project_name,
                    'notes_title': note.get('title', 'Untitled Notes'),
                    'created_at': note.get('created_at'),
                    'updated_at': note.get('updated_at')
                })

        # Sort by updated_at (most recent first)
        user_notes.sort(key=lambda x: x['updated_at'] or x['created_at'] or '', reverse=True)

        return {"notes": user_notes}

    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error fetching user notes: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))


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
