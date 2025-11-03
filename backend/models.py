from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict
from datetime import datetime


class VideoSegment(BaseModel):
    start_time: float
    end_time: float
    text: str


class VideoTranscript(BaseModel):
    segments: List[VideoSegment]
    full_text: str
    duration: float


class Question(BaseModel):
    id: Optional[str] = None
    question_text: str
    options: List[str]
    correct_answer: int  # Index of correct option
    explanation: str
    video_segment: VideoSegment
    difficulty: str = "medium"  # easy, medium, hard


class FlashCard(BaseModel):
    question: Question
    show_at_timestamp: float


class VideoProcessRequest(BaseModel):
    video_url: str
    title: Optional[str] = None


class VideoProcessResponse(BaseModel):
    video_id: str
    title: str
    duration: float
    transcript: VideoTranscript
    flashcards: List[FlashCard]
    message: str


class AnswerSubmission(BaseModel):
    question_id: str
    selected_answer: int
    timestamp: float


class AnswerResponse(BaseModel):
    correct: bool
    explanation: str
    video_segment: Optional[VideoSegment] = None
    redirect_timestamp: Optional[float] = None


class QuizRequest(BaseModel):
    video_id: str


class QuizResponse(BaseModel):
    quiz_id: str
    questions: List[Question]
    total_questions: int


class QuizSubmission(BaseModel):
    quiz_id: str
    answers: List[AnswerSubmission]


class QuizResult(BaseModel):
    quiz_id: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    details: List[Dict]
    weak_areas: List[VideoSegment]
