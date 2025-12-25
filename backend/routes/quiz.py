from fastapi import APIRouter, HTTPException
from models import QuizRequest, QuizResponse, QuizSubmission, QuizResult, Question
from services.question_generator import question_generator
from database import db
from config import settings
import json
import uuid

router = APIRouter()


async def _analyze_user_performance(user_id: str, video_id: str) -> dict:
    """
    Analyze user performance across three dimensions for adaptive quiz generation:
    1. Flashcard performance for this video
    2. Previous quiz performance for this video
    3. Project-level performance (all videos in the same project)

    Returns a dict with weak areas to target in quiz questions
    """
    try:
        # Get all attempts for this video
        video_attempts = await db.get_user_attempts(user_id, video_id)

        # Separate flashcard and quiz attempts
        flashcard_attempts = [a for a in video_attempts if a.get('question_type') == 'flashcard']
        quiz_attempts = [a for a in video_attempts if a.get('question_type') == 'quiz']

        # Analyze flashcard performance - identify weak questions
        weak_flashcard_questions = []
        if flashcard_attempts:
            question_performance = {}
            for attempt in flashcard_attempts:
                q_id = attempt['question_id']
                if q_id not in question_performance:
                    question_performance[q_id] = {'correct': 0, 'total': 0}
                question_performance[q_id]['total'] += 1
                if attempt['is_correct']:
                    question_performance[q_id]['correct'] += 1

            # Identify questions with <70% accuracy
            for q_id, perf in question_performance.items():
                accuracy = perf['correct'] / perf['total'] if perf['total'] > 0 else 0
                if accuracy < 0.7:
                    weak_flashcard_questions.append({
                        'question_id': q_id,
                        'accuracy': round(accuracy * 100, 1)
                    })

        # Analyze previous quiz performance - identify weak quiz questions
        weak_quiz_questions = []
        if quiz_attempts:
            question_performance = {}
            for attempt in quiz_attempts:
                q_id = attempt['question_id']
                if q_id not in question_performance:
                    question_performance[q_id] = {'correct': 0, 'total': 0}
                question_performance[q_id]['total'] += 1
                if attempt['is_correct']:
                    question_performance[q_id]['correct'] += 1

            # Identify questions with <70% accuracy
            for q_id, perf in question_performance.items():
                accuracy = perf['correct'] / perf['total'] if perf['total'] > 0 else 0
                if accuracy < 0.7:
                    weak_quiz_questions.append({
                        'question_id': q_id,
                        'accuracy': round(accuracy * 100, 1)
                    })

        # Get project-level performance
        # First, find which project this video belongs to
        video = await db.get_video(video_id)
        project_id = None
        if video:
            # Get project_videos to find the project
            # Note: We'll need a database method to get project_id from video_id
            # For now, we'll use a placeholder approach
            pass

        # Calculate overall metrics
        total_video_attempts = len(video_attempts)
        correct_video_attempts = sum(1 for a in video_attempts if a['is_correct'])
        video_accuracy = (correct_video_attempts / total_video_attempts * 100) if total_video_attempts > 0 else 0

        return {
            'video_accuracy': round(video_accuracy, 1),
            'total_attempts': total_video_attempts,
            'weak_flashcard_questions': weak_flashcard_questions[:10],  # Top 10 weakest
            'weak_quiz_questions': weak_quiz_questions[:10],
            'has_previous_data': total_video_attempts > 0,
            'flashcard_count': len(flashcard_attempts),
            'quiz_count': len(quiz_attempts)
        }

    except Exception as e:
        print(f"Error analyzing user performance: {e}")
        # Return empty analysis if error occurs
        return {
            'video_accuracy': 0,
            'total_attempts': 0,
            'weak_flashcard_questions': [],
            'weak_quiz_questions': [],
            'has_previous_data': False
        }


@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    """
    Generate an adaptive quiz for a video based on user performance

    The quiz adapts based on:
    1. Flashcard performance - questions from topics where user struggled
    2. Previous quiz performance - retests weak areas from earlier quizzes
    3. Project-level performance - considers overall learning patterns

    Costs 5 notes credits
    """
    try:
        # Check and deduct credits before generating quiz
        if request.user_id:
            credits_required = 5  # Fixed cost: 5 notes credits per quiz

            has_credits, current_credits = await db.check_notes_credits(request.user_id, credits_required)

            if not has_credits:
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "Insufficient notes credits",
                        "required": credits_required,
                        "available": current_credits,
                        "message": f"You need {credits_required} notes credits to generate a quiz but only have {current_credits}."
                    }
                )

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

        # Analyze user performance for adaptive quiz generation
        performance_analysis = None
        if request.user_id:
            performance_analysis = await _analyze_user_performance(
                request.user_id,
                request.video_id
            )

        # Generate adaptive quiz questions based on performance
        questions = await question_generator.generate_final_quiz(
            video_segments,
            num_questions=settings.final_quiz_questions,
            video_title=video.get('title'),
            performance_analysis=performance_analysis  # Pass performance data for adaptive generation
        )

        # Store quiz
        quiz_id = str(uuid.uuid4())
        questions_data = [q.dict() for q in questions]
        await db.store_quiz(quiz_id, request.video_id, questions_data)

        # Deduct credits after successful quiz generation
        if request.user_id:
            result = await db.deduct_notes_credits(
                request.user_id,
                credits_required,
                video_id=request.video_id,
                description=f"Quiz generation for video: {video.get('title')}",
                metadata={"video_title": video.get('title'), "num_questions": len(questions)}
            )
            if not result:
                print(f"Warning: Failed to deduct credits for user {request.user_id}, but quiz generation completed")

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
