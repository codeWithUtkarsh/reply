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
        topic_id: Optional[str] = None
    ) -> Optional[Dict]:

        logger.info(f"DB: store_video | video_id={video_id}, topic_id={topic_id}")

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

        if topic_id:
            await self.link_video_to_topic(video_id, topic_id)

        return video_data

    async def get_video(self, video_id: str) -> Optional[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("videos").select("*").eq("id", video_id).execute()
        )
        return result.data[0] if result.data else None

    # -------------------------
    # Topics
    # -------------------------

    async def create_topic(
        self,
        topic_name: str,
        project_id: str,
        topic_desc: Optional[str] = None
    ) -> Optional[Dict]:
        data = {
            "topic_name": topic_name,
            "topic_desc": topic_desc,
            "project_id": project_id,
            "created_at": datetime.utcnow().isoformat()
        }

        result = await run_in_threadpool(
            lambda: self.client.table("topics").insert(data).execute()
        )
        return result.data[0] if result.data else None

    async def get_topics_by_project(self, project_id: str) -> List[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("topics")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=False)
            .execute()
        )
        return result.data or []

    async def get_topic(self, topic_id: str) -> Optional[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("topics")
            .select("*")
            .eq("id", topic_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def link_video_to_topic(self, video_id: str, topic_id: str) -> Optional[Dict]:
        existing = await run_in_threadpool(
            lambda: self.client.table("topic_videos")
            .select("*")
            .eq("video_id", video_id)
            .eq("topic_id", topic_id)
            .execute()
        )

        if existing.data:
            logger.info(f"DB: Video {video_id} already linked to topic {topic_id}")
            return existing.data[0]

        data = {
            "video_id": video_id,
            "topic_id": topic_id,
            "created_at": datetime.utcnow().isoformat()
        }

        result = await run_in_threadpool(
            lambda: self.client.table("topic_videos").insert(data).execute()
        )
        logger.info(f"DB: Linked video {video_id} to topic {topic_id}")
        return result.data[0] if result.data else None

    async def get_videos_by_topic(self, topic_id: str) -> List[Dict]:
        """Get all videos for a specific topic"""
        # Get video IDs from junction table
        junction_result = await run_in_threadpool(
            lambda: self.client.table("topic_videos")
            .select("video_id")
            .eq("topic_id", topic_id)
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
        timestamp: float = 0
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
        return result.data[0] if result.data else None

    async def get_notes_by_id(self, notes_id: str) -> Optional[Dict]:
        result = await run_in_threadpool(
            lambda: self.client.table("video_notes")
            .select("*")
            .eq("notes_id", notes_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def update_notes(self, notes_id: str, title: str, sections: List[Dict]) -> Optional[Dict]:
        data = {"title": title, "sections": json.dumps(sections)}
        result = await run_in_threadpool(
            lambda: self.client.table("video_notes")
            .update(data)
            .eq("notes_id", notes_id)
            .execute()
        )
        return result.data[0] if result.data else None


db = Database()
