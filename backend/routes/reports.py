from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import db
from services.report_generator import report_generator
import json

router = APIRouter()


class AttemptSubmission(BaseModel):
    user_id: str
    video_id: str
    question_id: str
    question_type: str  # 'flashcard' or 'quiz'
    selected_answer: int
    correct_answer: int
    timestamp: Optional[float] = 0
    quiz_id: Optional[str] = None  # For tracking which quiz this attempt belongs to


class GenerateReportRequest(BaseModel):
    user_id: str
    video_id: str
    quiz_id: str


@router.post("/attempt")
async def record_attempt(attempt: AttemptSubmission):
    """Record a user's answer attempt"""
    try:
        is_correct = attempt.selected_answer == attempt.correct_answer

        result = await db.store_attempt(
            user_id=attempt.user_id,
            video_id=attempt.video_id,
            question_id=attempt.question_id,
            question_type=attempt.question_type,
            selected_answer=attempt.selected_answer,
            correct_answer=attempt.correct_answer,
            is_correct=is_correct,
            timestamp=attempt.timestamp,
            quiz_id=attempt.quiz_id  # Track which quiz this attempt belongs to
        )

        return {
            "success": True,
            "is_correct": is_correct,
            "attempt_number": result.get("attempt_number", 1) if result else 1
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recording attempt: {str(e)}")


@router.post("/generate")
async def generate_report(request: GenerateReportRequest):
    """Generate comprehensive learning report after quiz completion"""
    try:
        # Get video data
        video = await db.get_video(request.video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        # Parse transcript
        transcript_data = json.loads(video['transcript'])
        transcript_text = transcript_data.get('full_text', '')

        # Get all user attempts for this video
        attempts = await db.get_user_attempts(request.user_id, request.video_id)

        # Get both flashcard questions and quiz questions for analysis
        # Note: Currently quiz questions are from the same video/knowledge areas as flashcards
        # Future: Quiz questions may come from multiple videos/sources to test broader knowledge
        flashcard_questions = await db.get_questions(request.video_id)

        # Also get quiz questions
        quiz_data = await db.get_quiz(request.quiz_id)
        quiz_questions = []
        if quiz_data:
            questions_json = json.loads(quiz_data['questions'])
            quiz_questions = questions_json

        # Merge both types of questions for comprehensive knowledge assessment
        questions = flashcard_questions + quiz_questions

        # Convert attempts to the format needed by report generator
        attempts_data = []
        for attempt in attempts:
            attempts_data.append({
                'question_id': attempt['question_id'],
                'question_type': attempt['question_type'],
                'selected_answer': attempt['selected_answer'],
                'correct_answer': attempt['correct_answer'],
                'is_correct': attempt['is_correct'],
                'attempt_number': attempt.get('attempt_number', 1),
                'timestamp': attempt.get('timestamp', 0),
                'quiz_id': attempt.get('quiz_id')  # Include quiz_id for quiz score calculation
            })

        # Generate enhanced report with weak area analysis
        report = await report_generator.generate_report(
            user_id=request.user_id,
            video_id=request.video_id,
            quiz_id=request.quiz_id,
            transcript_text=transcript_text,
            attempts_data=attempts_data,
            questions_data=questions  # NEW: Pass questions for weak area analysis
        )

        # Store report in database (exclude attempts_data as it's only needed for API response)
        report_for_db = {k: v for k, v in report.items() if k != 'attempts_data'}
        await db.store_report(report_for_db)

        return {
            "success": True,
            "report_id": report['report_id'],
            "report": report
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@router.get("/{report_id}")
async def get_report(report_id: str):
    """Get a learning report by ID"""
    try:
        report = await db.get_report(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        # Parse JSON fields
        report['word_frequency'] = json.loads(report['word_frequency'])
        report['performance_stats'] = json.loads(report['performance_stats'])
        report['attempt_breakdown'] = json.loads(report['attempt_breakdown'])

        # Fetch attempts data for study pattern visualization
        attempts = await db.get_user_attempts(report['user_id'], report['video_id'])
        report['attempts_data'] = [
            {
                'question_id': attempt['question_id'],
                'question_type': attempt['question_type'],
                'selected_answer': attempt['selected_answer'],
                'correct_answer': attempt['correct_answer'],
                'is_correct': attempt['is_correct'],
                'attempt_number': attempt.get('attempt_number', 1),
                'timestamp': attempt.get('timestamp', 0),
                'quiz_id': attempt.get('quiz_id')
            }
            for attempt in attempts
        ]

        return report

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}")
async def get_user_reports(user_id: str, video_id: Optional[str] = None):
    """Get all reports for a user"""
    try:
        reports = await db.get_user_reports(user_id, video_id)

        # Parse JSON fields for each report and add attempts data
        for report in reports:
            report['word_frequency'] = json.loads(report['word_frequency'])
            report['performance_stats'] = json.loads(report['performance_stats'])
            report['attempt_breakdown'] = json.loads(report['attempt_breakdown'])

            # Fetch attempts data for study pattern visualization
            attempts = await db.get_user_attempts(report['user_id'], report['video_id'])
            report['attempts_data'] = [
                {
                    'question_id': attempt['question_id'],
                    'question_type': attempt['question_type'],
                    'selected_answer': attempt['selected_answer'],
                    'correct_answer': attempt['correct_answer'],
                    'is_correct': attempt['is_correct'],
                    'attempt_number': attempt.get('attempt_number', 1),
                    'timestamp': attempt.get('timestamp', 0),
                    'quiz_id': attempt.get('quiz_id')
                }
                for attempt in attempts
            ]

        return {
            "user_id": user_id,
            "total_reports": len(reports),
            "reports": reports
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attempts/{user_id}/{video_id}")
async def get_user_attempts(user_id: str, video_id: str):
    """Get all attempts for a user on a specific video"""
    try:
        attempts = await db.get_user_attempts(user_id, video_id)

        return {
            "user_id": user_id,
            "video_id": video_id,
            "total_attempts": len(attempts),
            "attempts": attempts
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
