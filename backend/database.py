from supabase import create_client, Client
from config import settings
from typing import List, Optional, Dict
import json
from datetime import datetime
from logging_config import get_logger
from fastapi.concurrency import run_in_threadpool

logger = get_logger(__name__)


class Database:
    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )

    # -------------------------
    # Videos
    # -------------------------

    async def store_video(
        self,
        video_id: str,
        title: str,
        duration: float,
        transcript: Dict,
        url: str,
        project_id: Optional[str] = None
    ) -> Optional[Dict]:

        logger.info(f"DB: store_video | video_id={video_id}, project_id={project_id}")

        existing = await self.get_video(video_id)
        if existing:
            logger.info("DB: Video already exists, skipping insert")
            video_data = existing
        else:
            data = {
                "id": video_id,
                "title": title,
                "video_length": duration,
                "transcript": json.dumps(transcript),
                "url": url,
                "created_at": datetime.utcnow().isoformat()
            }

            result = await run_in_threadpool(
                lambda: self.client.table("videos").insert(data).execute()
            )

            if not result.data:
                logger.error("DB: Video insert returned no data")
                return None

            video_data = result.data[0]

        if project_id:
            await self.link_video_to_project(video_id, project_id)

        return video_data

    async def get_video(self, video_id: str) -> Optional[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("videos").select("*").eq("id", video_id).execute()
        )
        return result.data[0] if result.data else None

    async def link_video_to_project(self, video_id: str, project_id: str) -> Optional[Dict]:
        existing = await run_in_threadpool(
            lambda: self.client.table("project_videos")
            .select("*")
            .eq("video_id", video_id)
            .eq("project_id", project_id)
            .execute()
        )

        if existing.data:
            logger.info(f"DB: Video {video_id} already linked to project {project_id}")
            return existing.data[0]

        data = {
            "video_id": video_id,
            "project_id": project_id,
            "created_at": datetime.utcnow().isoformat()
        }

        result = await run_in_threadpool(
            lambda: self.client.table("project_videos").insert(data).execute()
        )
        logger.info(f"DB: Linked video {video_id} to project {project_id}")
        return result.data[0] if result.data else None

    async def store_video_initial(
        self,
        video_id: str,
        title: str,
        duration: float,
        url: str,
        project_id: Optional[str] = None,
        processing_status: str = "processing"
    ) -> Optional[Dict]:
        """Store video with basic info for async processing"""
        logger.info(f"DB: store_video_initial | video_id={video_id}, status={processing_status}")

        existing = await self.get_video(video_id)
        if existing:
            logger.info("DB: Video already exists, skipping insert")
            video_data = existing
        else:
            data = {
                "id": video_id,
                "title": title,
                "video_length": duration,
                "transcript": None,  # Will be filled during processing
                "url": url,
                "processing_status": processing_status,
                "created_at": datetime.utcnow().isoformat()
            }

            result = await run_in_threadpool(
                lambda: self.client.table("videos").insert(data).execute()
            )

            if not result.data:
                logger.error("DB: Video insert returned no data")
                return None

            video_data = result.data[0]

        if project_id:
            await self.link_video_to_project(video_id, project_id)

        return video_data

    async def update_video_status(
        self,
        video_id: str,
        status: str,
        error_message: Optional[str] = None,
        batch_current: Optional[int] = None,
        batch_total: Optional[int] = None
    ) -> Optional[Dict]:
        """Update video processing status with optional batch tracking"""
        logger.info(f"DB: update_video_status | video_id={video_id}, status={status}, batch={batch_current}/{batch_total}")

        data = {
            "processing_status": status,
            "updated_at": datetime.utcnow().isoformat()
        }

        if error_message:
            data["error_message"] = error_message

        if batch_current is not None:
            data["batch_current"] = batch_current

        if batch_total is not None:
            data["batch_total"] = batch_total

        result = await run_in_threadpool(
            lambda: self.client.table("videos")
            .update(data)
            .eq("id", video_id)
            .execute()
        )

        return result.data[0] if result.data else None

    async def update_video_transcript(
        self,
        video_id: str,
        transcript: Dict
    ) -> Optional[Dict]:
        """Update video transcript after processing"""
        logger.info(f"DB: update_video_transcript | video_id={video_id}")

        data = {
            "transcript": json.dumps(transcript),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = await run_in_threadpool(
            lambda: self.client.table("videos")
            .update(data)
            .eq("id", video_id)
            .execute()
        )

        return result.data[0] if result.data else None

    async def get_videos_by_project(self, project_id: str) -> List[Dict]:
        """Get all videos for a specific project"""
        # Get video IDs from junction table
        junction_result = await run_in_threadpool(
            lambda: self.client.table("project_videos")
            .select("video_id")
            .eq("project_id", project_id)
            .execute()
        )

        if not junction_result.data:
            return []

        video_ids = [item['video_id'] for item in junction_result.data]

        # Get video details
        videos_result = await run_in_threadpool(
            lambda: self.client.table("videos")
            .select("*")
            .in_("id", video_ids)
            .execute()
        )

        return videos_result.data or []

    async def delete_video(self, video_id: str, project_id: Optional[str] = None) -> Dict:
        """
        Delete a video from a project or completely.
        If project_id is provided, only remove the link.
        If no project_id, delete the video and all associated data.
        """
        logger.info(f"DB: delete_video | video_id={video_id}, project_id={project_id}")

        if project_id:
            # Only remove link from specific project
            result = await run_in_threadpool(
                lambda: self.client.table("project_videos")
                .delete()
                .eq("video_id", video_id)
                .eq("project_id", project_id)
                .execute()
            )
            logger.info(f"DB: Unlinked video {video_id} from project {project_id}")

            # Check if video is still linked to other projects
            remaining_links = await run_in_threadpool(
                lambda: self.client.table("project_videos")
                .select("*")
                .eq("video_id", video_id)
                .execute()
            )

            # If no other projects use this video, delete everything
            if not remaining_links.data:
                logger.info(f"DB: No other projects use video {video_id}, deleting completely")
                return await self._delete_video_completely(video_id)

            return {"message": "Video removed from project", "deleted_completely": False}
        else:
            # Delete video completely
            return await self._delete_video_completely(video_id)

    async def _delete_video_completely(self, video_id: str) -> Dict:
        """Delete video and all associated data (questions, attempts, reports, notes, etc.)"""
        logger.info(f"DB: Deleting video {video_id} completely")

        # Delete in order: dependencies first, then the video
        # 1. Delete user attempts
        await run_in_threadpool(
            lambda: self.client.table("user_attempts")
            .delete()
            .eq("video_id", video_id)
            .execute()
        )

        # 2. Delete learning reports
        await run_in_threadpool(
            lambda: self.client.table("learning_reports")
            .delete()
            .eq("video_id", video_id)
            .execute()
        )

        # 3. Delete user progress
        await run_in_threadpool(
            lambda: self.client.table("user_progress")
            .delete()
            .eq("video_id", video_id)
            .execute()
        )

        # 4. Delete notes
        await run_in_threadpool(
            lambda: self.client.table("video_notes")
            .delete()
            .eq("video_id", video_id)
            .execute()
        )

        # 5. Delete quizzes
        await run_in_threadpool(
            lambda: self.client.table("quizzes")
            .delete()
            .eq("video_id", video_id)
            .execute()
        )

        # 6. Delete questions
        await run_in_threadpool(
            lambda: self.client.table("questions")
            .delete()
            .eq("video_id", video_id)
            .execute()
        )

        # 7. Delete project links
        await run_in_threadpool(
            lambda: self.client.table("project_videos")
            .delete()
            .eq("video_id", video_id)
            .execute()
        )

        # 8. Finally, delete the video itself
        await run_in_threadpool(
            lambda: self.client.table("videos")
            .delete()
            .eq("id", video_id)
            .execute()
        )

        logger.info(f"DB: Video {video_id} and all associated data deleted")
        return {"message": "Video deleted completely", "deleted_completely": True}

    async def delete_project(self, project_id: str) -> Dict:
        """
        Delete a project and all associated videos.
        Videos are only deleted if they're not linked to other projects.
        """
        logger.info(f"DB: delete_project | project_id={project_id}")

        # Get all videos linked to this project
        video_links = await run_in_threadpool(
            lambda: self.client.table("project_videos")
            .select("video_id")
            .eq("project_id", project_id)
            .execute()
        )

        video_ids = [link['video_id'] for link in video_links.data] if video_links.data else []

        # For each video, check if it's used by other projects
        for video_id in video_ids:
            # Get all project links for this video
            all_links = await run_in_threadpool(
                lambda: self.client.table("project_videos")
                .select("*")
                .eq("video_id", video_id)
                .execute()
            )

            # If this video is only linked to the current project, delete it completely
            if all_links.data and len(all_links.data) == 1:
                logger.info(f"DB: Video {video_id} only used by project {project_id}, deleting completely")
                await self._delete_video_completely(video_id)
            else:
                # Just remove the link
                logger.info(f"DB: Video {video_id} used by other projects, only removing link")
                await run_in_threadpool(
                    lambda: self.client.table("project_videos")
                    .delete()
                    .eq("video_id", video_id)
                    .eq("project_id", project_id)
                    .execute()
                )

        # Delete activity logs for this project
        await run_in_threadpool(
            lambda: self.client.table("activity_log")
            .delete()
            .eq("project_id", project_id)
            .execute()
        )

        # Finally, delete the project itself
        await run_in_threadpool(
            lambda: self.client.table("projects")
            .delete()
            .eq("id", project_id)
            .execute()
        )

        logger.info(f"DB: Project {project_id} and associated data deleted")
        return {
            "message": "Project deleted successfully",
            "videos_deleted": video_ids
        }

    # -------------------------
    # Questions
    # -------------------------

    async def store_questions(self, video_id: str, questions: List[Dict]) -> List[Dict]:
        payload = [
            {
                "video_id": video_id,
                "question_data": json.dumps(q),
                "created_at": datetime.utcnow().isoformat()
            }
            for q in questions
        ]

        result = await run_in_threadpool(
            lambda: self.client.table("questions").insert(payload).execute()
        )
        return result.data or []

    async def get_questions(self, video_id: str) -> List[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("questions")
            .select("*")
            .eq("video_id", video_id)
            .execute()
        )
        return result.data or []

    # -------------------------
    # Quiz
    # -------------------------

    async def store_quiz(self, quiz_id: str, video_id: str, questions: List[Dict]) -> Optional[Dict]:
        data = {
            "quiz_id": quiz_id,
            "video_id": video_id,
            "questions": json.dumps(questions),
            "created_at": datetime.utcnow().isoformat()
        }

        result = await run_in_threadpool(
            lambda: self.client.table("quizzes").insert(data).execute()
        )
        return result.data[0] if result.data else None

    async def get_quiz(self, quiz_id: str) -> Optional[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("quizzes")
            .select("*")
            .eq("quiz_id", quiz_id)
            .execute()
        )
        return result.data[0] if result.data else None

    # -------------------------
    # User Progress
    # -------------------------

    async def store_user_progress(self, user_id: str, video_id: str, progress_data: Dict) -> Optional[Dict]:
        data = {
            "user_id": user_id,
            "video_id": video_id,
            "progress_data": json.dumps(progress_data),
            "last_timestamp": progress_data.get("timestamp", 0),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = await run_in_threadpool(
            lambda: self.client.table("user_progress").upsert(data).execute()
        )
        return result.data[0] if result.data else None

    async def get_user_progress(self, user_id: str, video_id: str) -> Optional[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("user_progress")
            .select("*")
            .eq("user_id", user_id)
            .eq("video_id", video_id)
            .execute()
        )
        return result.data[0] if result.data else None

    # -------------------------
    # Attempts
    # -------------------------

    async def store_attempt(
        self,
        user_id: str,
        video_id: str,
        question_id: str,
        question_type: str,
        selected_answer: int,
        correct_answer: int,
        is_correct: bool,
        timestamp: float = 0,
        quiz_id: Optional[str] = None
    ) -> Optional[Dict]:

        existing = await run_in_threadpool(
            lambda: self.client.table("user_attempts")
            .select("*")
            .eq("user_id", user_id)
            .eq("question_id", question_id)
            .execute()
        )

        attempt_number = len(existing.data) + 1 if existing.data else 1

        data = {
            "user_id": user_id,
            "video_id": video_id,
            "question_id": question_id,
            "question_type": question_type,
            "selected_answer": selected_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "attempt_number": attempt_number,
            "timestamp": timestamp,
            "quiz_id": quiz_id,  # Store quiz_id for tracking quiz sessions
            "created_at": datetime.utcnow().isoformat()
        }

        result = await run_in_threadpool(
            lambda: self.client.table("user_attempts").insert(data).execute()
        )
        return result.data[0] if result.data else None

    async def get_user_attempts(self, user_id: str, video_id: str) -> List[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("user_attempts")
            .select("*")
            .eq("user_id", user_id)
            .eq("video_id", video_id)
            .execute()
        )
        return result.data or []

    # -------------------------
    # Reports
    # -------------------------

    async def store_report(self, report_data: Dict) -> Optional[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("learning_reports").insert(report_data).execute()
        )
        return result.data[0] if result.data else None

    async def get_report(self, report_id: str) -> Optional[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("learning_reports")
            .select("*")
            .eq("report_id", report_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_user_reports(self, user_id: str, video_id: Optional[str] = None) -> List[Dict]:
        def query():
            q = self.client.table("learning_reports").select("*").eq("user_id", user_id)
            if video_id:
                q = q.eq("video_id", video_id)
            return q.execute()

        result = await run_in_threadpool(query)
        return result.data or []

    # -------------------------
    # Notes
    # -------------------------

    async def store_notes(self, notes_data: Dict) -> Optional[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("video_notes").insert(notes_data).execute()
        )
        return result.data[0] if result.data else None

    async def get_notes_by_video(self, video_id: str) -> Optional[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("video_notes")
            .select("*")
            .eq("video_id", video_id)
            .execute()
        )
        if result.data:
            notes = result.data[0]
            # Parse sections if it's a JSON string
            if isinstance(notes.get('sections'), str):
                notes['sections'] = json.loads(notes['sections'])
            return notes
        return None

    async def get_notes_by_id(self, notes_id: str) -> Optional[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("video_notes")
            .select("*")
            .eq("notes_id", notes_id)
            .execute()
        )
        if result.data:
            notes = result.data[0]
            # Parse sections if it's a JSON string
            if isinstance(notes.get('sections'), str):
                notes['sections'] = json.loads(notes['sections'])
            return notes
        return None

    async def update_notes(self, notes_id: str, title: str, sections: List[Dict]) -> Optional[Dict]:
        data = {"title": title, "sections": json.dumps(sections)}
        result = await run_in_threadpool(
            lambda: self.client.table("video_notes")
            .update(data)
            .eq("notes_id", notes_id)
            .execute()
        )
        if result.data:
            notes = result.data[0]
            # Parse sections if it's a JSON string
            if isinstance(notes.get('sections'), str):
                notes['sections'] = json.loads(notes['sections'])
            return notes
        return None

    # -------------------------
    # Credit Management
    # -------------------------

    async def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile including credit information"""
        result = await run_in_threadpool(
            lambda: self.client.table("users")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def check_transcription_credits(self, user_id: str, required_credits: int) -> tuple[bool, int]:
        """
        Check if user has enough transcription credits.
        Returns (has_enough, current_credits)
        DEVELOPER role users have unlimited credits.
        """
        user = await self.get_user_profile(user_id)
        if not user:
            return False, 0

        # DEVELOPER role has unlimited credits
        if user.get('role') == 'developer':
            return True, float('inf')

        current_credits = user.get('transcription_credits', 0)
        return current_credits >= required_credits, current_credits

    async def check_notes_credits(self, user_id: str, required_credits: int) -> tuple[bool, int]:
        """
        Check if user has enough notes generation credits.
        Returns (has_enough, current_credits)
        DEVELOPER role users have unlimited credits.
        """
        user = await self.get_user_profile(user_id)
        if not user:
            return False, 0

        # DEVELOPER role has unlimited credits
        if user.get('role') == 'developer':
            return True, float('inf')

        current_credits = user.get('notes_credits', 0)
        return current_credits >= required_credits, current_credits

    async def deduct_transcription_credits(
        self,
        user_id: str,
        credits_to_deduct: int,
        video_id: Optional[str] = None,
        project_id: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Deduct transcription credits from user account.
        Does nothing for DEVELOPER role users.
        Returns updated user profile or None if insufficient credits.
        """
        user = await self.get_user_profile(user_id)
        if not user:
            logger.error(f"User {user_id} not found for credit deduction")
            return None

        # DEVELOPER role has unlimited credits, no deduction needed
        if user.get('role') == 'developer':
            logger.info(f"User {user_id} is DEVELOPER, skipping credit deduction")
            return user

        current_credits = user.get('transcription_credits', 0)
        if current_credits < credits_to_deduct:
            logger.warning(f"Insufficient transcription credits for user {user_id}: {current_credits} < {credits_to_deduct}")
            return None

        new_credits = current_credits - credits_to_deduct
        data = {
            "transcription_credits": new_credits,
            "updated_at": datetime.utcnow().isoformat()
        }

        result = await run_in_threadpool(
            lambda: self.client.table("users")
            .update(data)
            .eq("id", user_id)
            .execute()
        )

        if result.data:
            logger.info(f"Deducted {credits_to_deduct} transcription credits from user {user_id}. New balance: {new_credits}")

            # Log to credit history
            await self._log_credit_history(
                user_id=user_id,
                video_id=video_id,
                project_id=project_id,
                credit_type='transcription',
                amount=credits_to_deduct,
                operation='deduct',
                balance_before=current_credits,
                balance_after=new_credits,
                description=description or f"Deducted {credits_to_deduct} credits for video transcription",
                metadata=metadata or {}
            )

            return result.data[0]
        return None

    async def deduct_notes_credits(
        self,
        user_id: str,
        credits_to_deduct: int,
        video_id: Optional[str] = None,
        project_id: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Deduct notes generation credits from user account.
        Does nothing for DEVELOPER role users.
        Returns updated user profile or None if insufficient credits.
        """
        user = await self.get_user_profile(user_id)
        if not user:
            logger.error(f"User {user_id} not found for credit deduction")
            return None

        # DEVELOPER role has unlimited credits, no deduction needed
        if user.get('role') == 'developer':
            logger.info(f"User {user_id} is DEVELOPER, skipping credit deduction")
            return user

        current_credits = user.get('notes_credits', 0)
        if current_credits < credits_to_deduct:
            logger.warning(f"Insufficient notes credits for user {user_id}: {current_credits} < {credits_to_deduct}")
            return None

        new_credits = current_credits - credits_to_deduct
        data = {
            "notes_credits": new_credits,
            "updated_at": datetime.utcnow().isoformat()
        }

        result = await run_in_threadpool(
            lambda: self.client.table("users")
            .update(data)
            .eq("id", user_id)
            .execute()
        )

        if result.data:
            logger.info(f"Deducted {credits_to_deduct} notes credits from user {user_id}. New balance: {new_credits}")

            # Log to credit history
            await self._log_credit_history(
                user_id=user_id,
                video_id=video_id,
                project_id=project_id,
                credit_type='notes',
                amount=credits_to_deduct,
                operation='deduct',
                balance_before=current_credits,
                balance_after=new_credits,
                description=description or f"Deducted {credits_to_deduct} credits for notes generation",
                metadata=metadata or {}
            )

            return result.data[0]
        return None

    async def add_credits(self, user_id: str, transcription_credits: int = 0, notes_credits: int = 0) -> Optional[Dict]:
        """
        Add credits to user account (for admin/promotional purposes).
        """
        user = await self.get_user_profile(user_id)
        if not user:
            logger.error(f"User {user_id} not found for adding credits")
            return None

        data = {
            "updated_at": datetime.utcnow().isoformat()
        }

        if transcription_credits > 0:
            current_transcription = user.get('transcription_credits', 0)
            data["transcription_credits"] = current_transcription + transcription_credits

        if notes_credits > 0:
            current_notes = user.get('notes_credits', 0)
            data["notes_credits"] = current_notes + notes_credits

        result = await run_in_threadpool(
            lambda: self.client.table("users")
            .update(data)
            .eq("id", user_id)
            .execute()
        )

        if result.data:
            logger.info(f"Added {transcription_credits} transcription and {notes_credits} notes credits to user {user_id}")
            return result.data[0]
        return None

    # -------------------------
    # Credit History
    # -------------------------

    async def _log_credit_history(
        self,
        user_id: str,
        credit_type: str,
        amount: int,
        operation: str,
        balance_before: int,
        balance_after: int,
        video_id: Optional[str] = None,
        project_id: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Internal method to log credit transactions"""
        data = {
            "user_id": user_id,
            "video_id": video_id,
            "project_id": project_id,
            "credit_type": credit_type,
            "amount": amount,
            "operation": operation,
            "balance_before": balance_before,
            "balance_after": balance_after,
            "description": description,
            "metadata": json.dumps(metadata or {}),
            "created_at": datetime.utcnow().isoformat()
        }

        try:
            result = await run_in_threadpool(
                lambda: self.client.table("credit_history").insert(data).execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to log credit history: {str(e)}")
            return None

    async def get_credit_history(self, user_id: str, limit: int = 100) -> List[Dict]:
        """Get credit transaction history for a user"""
        try:
            result = await run_in_threadpool(
                lambda: self.client.from_("credit_history")
                .select("id, user_id, video_id, project_id, credit_type, amount, operation, balance_before, balance_after, description, metadata, created_at, videos(title), projects(project_name)")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )

            # Flatten the nested structure from foreign key expansion
            if result.data:
                flattened_data = []
                for entry in result.data:
                    flattened_entry = {
                        "id": entry.get("id"),
                        "user_id": entry.get("user_id"),
                        "video_id": entry.get("video_id"),
                        "video_title": entry.get("videos", {}).get("title") if entry.get("videos") else None,
                        "project_id": entry.get("project_id"),
                        "project_name": entry.get("projects", {}).get("project_name") if entry.get("projects") else None,
                        "credit_type": entry.get("credit_type"),
                        "amount": entry.get("amount"),
                        "operation": entry.get("operation"),
                        "balance_before": entry.get("balance_before"),
                        "balance_after": entry.get("balance_after"),
                        "description": entry.get("description"),
                        "metadata": entry.get("metadata"),
                        "created_at": entry.get("created_at"),
                    }
                    flattened_data.append(flattened_entry)
                return flattened_data
            return []
        except Exception as e:
            logger.error(f"Failed to fetch credit history: {str(e)}")
            return []


db = Database()
