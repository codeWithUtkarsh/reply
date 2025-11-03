from openai import OpenAI
from config import settings
from typing import List
from models import Question, VideoSegment, FlashCard
import json
import uuid


class QuestionGenerator:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    async def generate_questions_for_segment(
        self,
        segment: VideoSegment,
        num_questions: int = 1
    ) -> List[Question]:
        """Generate questions based on a video segment"""

        prompt = f"""
Based on the following video segment content, generate {num_questions} multiple-choice question(s)
to test the viewer's understanding.

Video Segment (Time: {self._format_time(segment.start_time)} - {self._format_time(segment.end_time)}):
{segment.text}

For each question, provide:
1. A clear question text
2. Four multiple choice options (A, B, C, D)
3. The index of the correct answer (0-3)
4. A detailed explanation of why the answer is correct

Format your response as a JSON array of objects with this structure:
[
  {{
    "question_text": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "The correct answer is A because...",
    "difficulty": "medium"
  }}
]

Make questions that are specific to the content discussed in this segment.
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Cost-effective model
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational content creator who generates "
                                 "insightful questions to test comprehension of video content."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )

            # Parse response
            content = response.choices[0].message.content
            questions_data = json.loads(content)

            # Handle both array and object responses
            if isinstance(questions_data, dict):
                if 'questions' in questions_data:
                    questions_data = questions_data['questions']
                else:
                    questions_data = [questions_data]

            questions = []
            for q_data in questions_data[:num_questions]:
                question = Question(
                    id=str(uuid.uuid4()),
                    question_text=q_data['question_text'],
                    options=q_data['options'],
                    correct_answer=q_data['correct_answer'],
                    explanation=q_data['explanation'],
                    difficulty=q_data.get('difficulty', 'medium'),
                    video_segment=segment
                )
                questions.append(question)

            return questions

        except Exception as e:
            # Fallback question if generation fails
            return [self._create_fallback_question(segment)]

    async def generate_flashcards(
        self,
        segments: List[VideoSegment],
        interval: int = 120
    ) -> List[FlashCard]:
        """Generate flashcards for video segments"""

        flashcards = []
        for i, segment in enumerate(segments):
            # Generate one question per segment
            questions = await self.generate_questions_for_segment(segment, num_questions=1)

            if questions:
                # Show flashcard at the end of each segment
                flashcard = FlashCard(
                    question=questions[0],
                    show_at_timestamp=segment.end_time
                )
                flashcards.append(flashcard)

        return flashcards

    async def generate_final_quiz(
        self,
        segments: List[VideoSegment],
        num_questions: int = 10
    ) -> List[Question]:
        """Generate a final comprehensive quiz"""

        # Distribute questions across segments
        questions_per_segment = max(1, num_questions // len(segments))
        all_questions = []

        for segment in segments:
            questions = await self.generate_questions_for_segment(
                segment,
                num_questions=questions_per_segment
            )
            all_questions.extend(questions)

        # Return exactly num_questions
        return all_questions[:num_questions]

    def _create_fallback_question(self, segment: VideoSegment) -> Question:
        """Create a fallback question if generation fails"""
        return Question(
            id=str(uuid.uuid4()),
            question_text=f"What was discussed during the segment from "
                         f"{self._format_time(segment.start_time)} to "
                         f"{self._format_time(segment.end_time)}?",
            options=[
                segment.text[:50] + "...",
                "Unrelated topic A",
                "Unrelated topic B",
                "Unrelated topic C"
            ],
            correct_answer=0,
            explanation=f"This segment covered: {segment.text[:100]}...",
            difficulty="easy",
            video_segment=segment
        )

    def _format_time(self, seconds: float) -> str:
        """Format seconds to MM:SS"""
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins}:{secs:02d}"


question_generator = QuestionGenerator()
