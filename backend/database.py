from supabase import create_client, Client
from config import settings
from typing import List, Optional, Dict
import json
from datetime import datetime
from logging_config import get_logger

logger = get_logger(__name__)


class Database:
    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )

    async def store_video(self, video_id: str, title: str, duration: float,
                         transcript: Dict, url: str, project_id: Optional[str] = None) -> Dict:
        """Store video metadata and transcript"""
        logger.info(f"DB: Storing video - ID: {video_id}, Project ID: {project_id}, Title: {title}")

        try:
            data = {
                "id": video_id,
                "title": title,
                "video_length": duration,
                "transcript": json.dumps(transcript),
                "url": url,
                "created_at": datetime.utcnow().isoformat()
            }
            if project_id:
                data["project_id"] = project_id

            result = self.client.table("videos").insert(data).execute()

            if result.data:
                logger.info(f"DB: Successfully stored video - ID: {video_id}")
                return result.data[0]
            else:
                logger.error(f"DB: No data returned when storing video - ID: {video_id}")
                return None

        except Exception as e:
            logger.error(f"DB: Error storing video - ID: {video_id}, Error: {type(e).__name__}: {str(e)}", exc_info=True)
            raise

    async def get_video(self, video_id: str) -> Optional[Dict]:
        """Retrieve video by ID"""
        logger.info(f"DB: Fetching video - ID: {video_id}")

        try:
            result = self.client.table("videos").select("*").eq("id", video_id).execute()

            if result.data:
                logger.info(f"DB: Successfully fetched video - ID: {video_id}")
                return result.data[0]
            else:
                logger.warning(f"DB: Video not found - ID: {video_id}")
                return None

        except Exception as e:
            logger.error(f"DB: Error fetching video - ID: {video_id}, Error: {type(e).__name__}: {str(e)}", exc_info=True)
            raise

    async def store_questions(self, video_id: str, questions: List[Dict]) -> List[Dict]:
        """Store generated questions for a video"""
        logger.info(f"DB: Storing {len(questions)} questions for video - ID: {video_id}")

        try:
            data = [{
                "video_id": video_id,
                "question_data": json.dumps(question),
                "created_at": datetime.utcnow().isoformat()
            } for question in questions]

            result = self.client.table("questions").insert(data).execute()

            if result.data:
                logger.info(f"DB: Successfully stored {len(result.data)} questions for video - ID: {video_id}")
                return result.data
            else:
                logger.warning(f"DB: No data returned when storing questions for video - ID: {video_id}")
                return []

        except Exception as e:
            logger.error(f"DB: Error storing questions for video - ID: {video_id}, Error: {type(e).__name__}: {str(e)}", exc_info=True)
            raise

    async def get_questions(self, video_id: str) -> List[Dict]:
        """Retrieve all questions for a video"""
        result = self.client.table("questions").select("*").eq("video_id", video_id).execute()
        return result.data if result.data else []

    async def store_quiz(self, quiz_id: str, video_id: str, questions: List[Dict]) -> Dict:
        """Store a quiz"""
        data = {
            "quiz_id": quiz_id,
            "video_id": video_id,
            "questions": json.dumps(questions),
            "created_at": datetime.utcnow().isoformat()
        }
        result = self.client.table("quizzes").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_quiz(self, quiz_id: str) -> Optional[Dict]:
        """Retrieve a quiz by ID"""
        result = self.client.table("quizzes").select("*").eq("quiz_id", quiz_id).execute()
        return result.data[0] if result.data else None

    async def store_user_progress(self, user_id: str, video_id: str,
                                  progress_data: Dict) -> Dict:
        """Store user progress on a video"""
        data = {
            "user_id": user_id,
            "video_id": video_id,
            "progress_data": json.dumps(progress_data),
            "last_timestamp": progress_data.get("timestamp", 0),
            "updated_at": datetime.utcnow().isoformat()
        }

        # Upsert to update if exists
        result = self.client.table("user_progress").upsert(data).execute()
        return result.data[0] if result.data else None

    async def get_user_progress(self, user_id: str, video_id: str) -> Optional[Dict]:
        """Retrieve user progress for a video"""
        result = (self.client.table("user_progress")
                 .select("*")
                 .eq("user_id", user_id)
                 .eq("video_id", video_id)
                 .execute())
        return result.data[0] if result.data else None

    async def store_attempt(self, user_id: str, video_id: str, question_id: str,
                          question_type: str, selected_answer: int, correct_answer: int,
                          is_correct: bool, timestamp: float = 0) -> Dict:
        """Store a user's answer attempt"""
        # Get attempt number for this question
        existing_attempts = self.client.table("user_attempts").select("*").eq("user_id", user_id).eq("question_id", question_id).execute()
        attempt_number = len(existing_attempts.data) + 1 if existing_attempts.data else 1

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
        result = self.client.table("user_attempts").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_user_attempts(self, user_id: str, video_id: str) -> List[Dict]:
        """Get all attempts for a user on a specific video"""
        result = (self.client.table("user_attempts")
                 .select("*")
                 .eq("user_id", user_id)
                 .eq("video_id", video_id)
                 .execute())
        return result.data if result.data else []

    async def store_report(self, report_data: Dict) -> Dict:
        """Store a learning report"""
        data = {
            "report_id": report_data['report_id'],
            "user_id": report_data['user_id'],
            "video_id": report_data['video_id'],
            "quiz_id": report_data.get('quiz_id'),
            "word_frequency": json.dumps(report_data['word_frequency']),
            "performance_stats": json.dumps(report_data['performance_stats']),
            "attempt_breakdown": json.dumps(report_data['attempt_breakdown']),
            "key_takeaways": report_data['key_takeaways'],
            "video_type": report_data.get('video_type', 'General'),
            "domain": report_data.get('domain', 'Mixed'),
            "main_topics": report_data.get('main_topics', []),
            "created_at": datetime.utcnow().isoformat()
        }
        result = self.client.table("learning_reports").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_report(self, report_id: str) -> Optional[Dict]:
        """Retrieve a learning report by ID"""
        result = self.client.table("learning_reports").select("*").eq("report_id", report_id).execute()
        return result.data[0] if result.data else None

    async def get_user_reports(self, user_id: str, video_id: str = None) -> List[Dict]:
        """Get all reports for a user, optionally filtered by video"""
        query = self.client.table("learning_reports").select("*").eq("user_id", user_id)
        if video_id:
            query = query.eq("video_id", video_id)
        result = query.execute()
        return result.data if result.data else []

    async def store_notes(self, notes_data: Dict) -> Dict:
        """Store video notes"""
        data = {
            "notes_id": notes_data['notes_id'],
            "video_id": notes_data['video_id'],
            "title": notes_data['title'],
            "sections": json.dumps(notes_data['sections']),
            "created_at": datetime.utcnow().isoformat()
        }
        result = self.client.table("video_notes").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_notes_by_video(self, video_id: str) -> Optional[Dict]:
        """Retrieve notes for a video"""
        result = self.client.table("video_notes").select("*").eq("video_id", video_id).execute()
        if result.data:
            # Parse sections JSON
            note = result.data[0]
            note['sections'] = json.loads(note['sections']) if isinstance(note['sections'], str) else note['sections']
            return note
        return None

    async def get_notes_by_id(self, notes_id: str) -> Optional[Dict]:
        """Retrieve notes by notes_id"""
        result = self.client.table("video_notes").select("*").eq("notes_id", notes_id).execute()
        if result.data:
            note = result.data[0]
            note['sections'] = json.loads(note['sections']) if isinstance(note['sections'], str) else note['sections']
            return note
        return None

    async def update_notes(self, notes_id: str, title: str, sections: List[Dict]) -> Dict:
        """Update existing notes"""
        data = {
            "title": title,
            "sections": json.dumps(sections),
        }
        result = self.client.table("video_notes").update(data).eq("notes_id", notes_id).execute()
        if result.data:
            note = result.data[0]
            note['sections'] = json.loads(note['sections']) if isinstance(note['sections'], str) else note['sections']
            return note
        return None


# Create database instance
db = Database()
