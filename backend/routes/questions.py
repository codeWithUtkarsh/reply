from fastapi import APIRouter, HTTPException
from models import AnswerSubmission, AnswerResponse
from database import db
import json

router = APIRouter()


@router.post("/answer", response_model=AnswerResponse)
async def submit_answer(answer: AnswerSubmission):
    """
    Submit an answer to a flashcard question
    Returns whether answer is correct and provides video timestamp if wrong
    """
    try:
        # In a real app, you'd fetch the question from database
        # For now, we'll return a response structure
        # You should implement proper question lookup

        # TODO: Fetch actual question from database using answer.question_id
        # question = await db.get_question_by_id(answer.question_id)

        # Simulated response - replace with actual logic
        is_correct = True  # This should be: answer.selected_answer == question.correct_answer

        if is_correct:
            return AnswerResponse(
                correct=True,
                explanation="Great job! That's the correct answer.",
                video_segment=None,
                redirect_timestamp=None
            )
        else:
            # If wrong, provide the video segment to review
            # This data should come from the question object
            return AnswerResponse(
                correct=False,
                explanation="That's not quite right. Please review the video segment where this concept is explained.",
                video_segment=None,  # Should be question.video_segment
                redirect_timestamp=120.0  # Should be question.video_segment.start_time
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{video_id}/flashcards")
async def get_flashcards(video_id: str):
    """Get all flashcards for a video"""
    try:
        questions = await db.get_questions(video_id)

        flashcards = []
        for q in questions:
            q_data = json.loads(q['question_data'])
            flashcards.append({
                "question": q_data,
                "show_at_timestamp": q_data.get('show_at_timestamp', 0)
            })

        return {
            "video_id": video_id,
            "flashcards": flashcards,
            "count": len(flashcards)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
