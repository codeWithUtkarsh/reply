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
        num_questions: int = 1,
        context_segments: List[VideoSegment] = None,
        video_title: str = None
    ) -> List[Question]:
        """Generate high-quality questions based on a video segment with surrounding context"""

        # Build context from surrounding segments
        context_text = ""
        if context_segments:
            context_text = "\n\nSurrounding Context:\n"
            for ctx_seg in context_segments:
                context_text += f"- {ctx_seg.text[:100]}...\n"

        video_context = f"\nVideo Title: {video_title}\n" if video_title else ""

        prompt = f"""
You are an expert educational assessment designer. Generate {num_questions} high-quality multiple-choice question(s)
that test UNDERSTANDING and APPLICATION, not just memorization.

{video_context}{context_text}

Target Segment (Time: {self._format_time(segment.start_time)} - {self._format_time(segment.end_time)}):
{segment.text}

CRITICAL QUALITY CRITERIA:

1. COGNITIVE DEPTH (Bloom's Taxonomy):
   - Focus on "Understand" and "Apply" levels
   - Ask WHY/HOW questions, not just WHAT
   - Test comprehension of concepts, not trivial facts
   - Example GOOD: "Why does X lead to Y in this context?"
   - Example BAD: "What color was mentioned?" (too trivial)

2. QUESTION FOCUS:
   - Target the MAIN POINT or key concept of the segment
   - Avoid questions about minor details or examples
   - Make the question meaningful and educational

3. DISTRACTOR QUALITY (Wrong Answers):
   - Must be PLAUSIBLE - could fool someone who half-understood
   - Based on common misconceptions or partial understanding
   - Not obviously wrong or absurd
   - Example GOOD: Similar concepts that are easily confused
   - Example BAD: Completely unrelated or nonsensical options

4. CLARITY:
   - Question must be clear and unambiguous
   - No trick questions or ambiguous wording
   - Self-contained (doesn't require info not in segment)

EXAMPLES OF QUALITY:

GOOD Question:
{{
  "question_text": "Based on the explanation, why is recursion more suitable than iteration for this problem?",
  "options": [
    "It naturally handles the tree-like structure of the data",
    "It uses less memory than iteration",
    "It executes faster in all cases",
    "It's easier to write in any programming language"
  ],
  "correct_answer": 0,
  "explanation": "Recursion is ideal here because the problem has a tree-like structure where each node requires the same operation. While recursion typically uses more memory (not less), it provides cleaner code for hierarchical data.",
  "difficulty": "medium"
}}

BAD Question (DON'T DO THIS):
{{
  "question_text": "What word did the speaker use at 2:30?",
  "options": ["recursion", "iteration", "algorithm", "function"],
  "correct_answer": 0,
  "explanation": "The speaker said recursion",
  "difficulty": "easy"
}}
^ BAD because: Tests memorization, not understanding. Too trivial.

FORMAT your response as a JSON array:
[
  {{
    "question_text": "...",
    "options": ["...", "...", "...", "..."],
    "correct_answer": 0,
    "explanation": "...",
    "difficulty": "medium"
  }}
]

Generate {num_questions} question(s) that meet ALL quality criteria above.
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Better quality than mini
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational assessment designer who creates thought-provoking questions "
                                 "that test deep understanding, not surface-level memorization. You follow Bloom's Taxonomy "
                                 "and create questions at the 'Understand' and 'Apply' cognitive levels."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.5,  # Lower for more consistent quality
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
        interval: int = 120,
        video_title: str = None
    ) -> List[FlashCard]:
        """Generate flashcards for video segments with context"""

        flashcards = []
        for i, segment in enumerate(segments):
            # Get surrounding context (previous and next segments)
            context_segments = []
            if i > 0:
                context_segments.append(segments[i - 1])  # Previous segment
            if i < len(segments) - 1:
                context_segments.append(segments[i + 1])  # Next segment

            # Generate one high-quality question per segment
            questions = await self.generate_questions_for_segment(
                segment,
                num_questions=1,
                context_segments=context_segments,
                video_title=video_title
            )

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
        num_questions: int = 10,
        video_title: str = None
    ) -> List[Question]:
        """Generate a final comprehensive quiz with high-quality questions"""

        # Distribute questions across segments
        questions_per_segment = max(1, num_questions // len(segments))
        all_questions = []

        for i, segment in enumerate(segments):
            # Get surrounding context
            context_segments = []
            if i > 0:
                context_segments.append(segments[i - 1])
            if i < len(segments) - 1:
                context_segments.append(segments[i + 1])

            questions = await self.generate_questions_for_segment(
                segment,
                num_questions=questions_per_segment,
                context_segments=context_segments,
                video_title=video_title
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
