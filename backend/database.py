from supabase import create_client, Client
from config import settings
from typing import List, Optional, Dict
import json
from datetime import datetime


class Database:
    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )

    async def store_video(self, video_id: str, title: str, duration: float,
                         transcript: Dict, url: str) -> Dict:
        """Store video metadata and transcript"""
        data = {
            "video_id": video_id,
            "title": title,
            "duration": duration,
            "transcript": json.dumps(transcript),
            "url": url,
            "created_at": datetime.utcnow().isoformat()
        }
        result = self.client.table("videos").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_video(self, video_id: str) -> Optional[Dict]:
        """Retrieve video by ID"""
        result = self.client.table("videos").select("*").eq("video_id", video_id).execute()
        return result.data[0] if result.data else None

    async def store_questions(self, video_id: str, questions: List[Dict]) -> List[Dict]:
        """Store generated questions for a video"""
        data = [{
            "video_id": video_id,
            "question_data": json.dumps(question),
            "created_at": datetime.utcnow().isoformat()
        } for question in questions]

        result = self.client.table("questions").insert(data).execute()
        return result.data if result.data else []

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


# Create database instance
db = Database()
