from fastapi import APIRouter, HTTPException
from models import QuizRequest, QuizResponse, QuizSubmission, QuizResult, Question
from services.question_generator import question_generator
from database import db
from config import settings
import json
import uuid

router = APIRouter()


@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    """
    Generate a final quiz for a video
    Creates 10 questions covering the entire video content
    """
    try:
        # Get video and transcript
        video = await db.get_video(request.video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        # Parse transcript
        transcript_data = json.loads(video['transcript'])
        segments = transcript_data['segments']

        # Convert to VideoSegment objects
        from models import VideoSegment
        video_segments = [
            VideoSegment(**seg) for seg in segments
        ]

        # Generate quiz questions
        questions = await question_generator.generate_final_quiz(
            video_segments,
            num_questions=settings.final_quiz_questions
        )

        # Store quiz
        quiz_id = str(uuid.uuid4())
        questions_data = [q.dict() for q in questions]
        await db.store_quiz(quiz_id, request.video_id, questions_data)

        return QuizResponse(
            quiz_id=quiz_id,
            questions=questions,
            total_questions=len(questions)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")


@router.post("/submit", response_model=QuizResult)
async def submit_quiz(submission: QuizSubmission):
    """
    Submit quiz answers and get results
    Returns score and identifies weak areas with video timestamps
    """
    try:
        # Get quiz from database
        quiz = await db.get_quiz(submission.quiz_id)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Parse quiz questions
        questions_data = json.loads(quiz['questions'])
        questions = [Question(**q) for q in questions_data]

        # Grade the quiz
        correct_count = 0
        details = []
        weak_segments = []

        for answer in submission.answers:
            # Find the corresponding question
            question = next(
                (q for q in questions if q.id == answer.question_id),
                None
            )

            if not question:
                continue

            is_correct = answer.selected_answer == question.correct_answer

            if is_correct:
                correct_count += 1

            detail = {
                "question_id": question.id,
                "question_text": question.question_text,
                "selected_answer": answer.selected_answer,
                "correct_answer": question.correct_answer,
                "is_correct": is_correct,
                "explanation": question.explanation,
                "video_segment": question.video_segment.dict() if not is_correct else None
            }
            details.append(detail)

            # Add to weak areas if incorrect
            if not is_correct and question.video_segment:
                weak_segments.append(question.video_segment)

        # Calculate score
        total_questions = len(questions)
        score_percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0

        return QuizResult(
            quiz_id=submission.quiz_id,
            total_questions=total_questions,
            correct_answers=correct_count,
            score_percentage=round(score_percentage, 2),
            details=details,
            weak_areas=weak_segments
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting quiz: {str(e)}")


@router.get("/{quiz_id}")
async def get_quiz(quiz_id: str):
    """Get quiz by ID"""
    try:
        quiz = await db.get_quiz(quiz_id)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        questions = json.loads(quiz['questions'])

        return {
            "quiz_id": quiz_id,
            "video_id": quiz['video_id'],
            "questions": questions,
            "total_questions": len(questions)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
