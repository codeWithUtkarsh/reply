from typing import List, Dict
import re
from collections import Counter
import uuid


class ReportGenerator:
    def __init__(self):
        # Common stop words to filter out
        self.stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
            'when', 'where', 'why', 'how', 'all', 'each', 'every', 'some', 'any',
            'few', 'more', 'most', 'other', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'under', 'again', 'further',
            'then', 'once', 'here', 'there', 'all', 'both', 'each', 'few', 'more',
            'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
            'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'now'
        }

    def generate_word_frequency(self, transcript_text: str, top_n: int = 30) -> Dict[str, int]:
        """
        Generate word frequency map from transcript
        Returns top N most frequent meaningful words
        """
        # Clean and tokenize text
        text = transcript_text.lower()
        # Remove special characters and numbers
        text = re.sub(r'[^a-z\s]', '', text)
        words = text.split()

        # Filter stop words and short words
        meaningful_words = [
            word for word in words
            if word not in self.stop_words and len(word) > 3
        ]

        # Count frequency
        word_freq = Counter(meaningful_words)

        # Return top N words
        return dict(word_freq.most_common(top_n))

    def extract_key_takeaways(self, transcript_text: str, word_frequency: Dict[str, int]) -> List[str]:
        """
        Extract key takeaways based on high-frequency words
        Returns list of important phrases/topics
        """
        # Get top 10 words
        top_words = list(word_frequency.keys())[:10]

        # Find sentences containing these words
        sentences = re.split(r'[.!?]+', transcript_text)
        key_sentences = []

        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20:  # Skip very short sentences
                continue

            # Check if sentence contains important words
            sentence_lower = sentence.lower()
            word_count = sum(1 for word in top_words if word in sentence_lower)

            if word_count >= 2:  # Sentence contains at least 2 key words
                key_sentences.append(sentence)

        # Return up to 5 key takeaways
        return key_sentences[:5]

    def analyze_performance(self, attempts_data: List[Dict]) -> Dict:
        """
        Analyze user performance from attempts data
        """
        if not attempts_data:
            return {
                'total_attempts': 0,
                'correct_count': 0,
                'incorrect_count': 0,
                'accuracy_rate': 0,
                'by_question': {}
            }

        total_attempts = len(attempts_data)
        correct_count = sum(1 for attempt in attempts_data if attempt['is_correct'])
        incorrect_count = total_attempts - correct_count

        # Group by question
        by_question = {}
        for attempt in attempts_data:
            question_id = attempt['question_id']
            if question_id not in by_question:
                by_question[question_id] = {
                    'attempts': 0,
                    'correct': 0,
                    'incorrect': 0,
                    'question_type': attempt.get('question_type', 'unknown')
                }

            by_question[question_id]['attempts'] += 1
            if attempt['is_correct']:
                by_question[question_id]['correct'] += 1
            else:
                by_question[question_id]['incorrect'] += 1

        return {
            'total_attempts': total_attempts,
            'correct_count': correct_count,
            'incorrect_count': incorrect_count,
            'accuracy_rate': round((correct_count / total_attempts * 100) if total_attempts > 0 else 0, 2),
            'by_question': by_question
        }

    def generate_attempt_breakdown(self, attempts_data: List[Dict]) -> Dict:
        """
        Generate detailed breakdown of attempts
        """
        flashcard_attempts = [a for a in attempts_data if a['question_type'] == 'flashcard']
        quiz_attempts = [a for a in attempts_data if a['question_type'] == 'quiz']

        return {
            'flashcards': {
                'total': len(flashcard_attempts),
                'correct': sum(1 for a in flashcard_attempts if a['is_correct']),
                'incorrect': sum(1 for a in flashcard_attempts if not a['is_correct']),
                'accuracy': round((sum(1 for a in flashcard_attempts if a['is_correct']) / len(flashcard_attempts) * 100) if flashcard_attempts else 0, 2)
            },
            'quiz': {
                'total': len(quiz_attempts),
                'correct': sum(1 for a in quiz_attempts if a['is_correct']),
                'incorrect': sum(1 for a in quiz_attempts if not a['is_correct']),
                'accuracy': round((sum(1 for a in quiz_attempts if a['is_correct']) / len(quiz_attempts) * 100) if quiz_attempts else 0, 2)
            }
        }

    async def generate_report(
        self,
        user_id: str,
        video_id: str,
        quiz_id: str,
        transcript_text: str,
        attempts_data: List[Dict]
    ) -> Dict:
        """
        Generate comprehensive learning report
        """
        # Generate word frequency
        word_frequency = self.generate_word_frequency(transcript_text)

        # Extract key takeaways
        key_takeaways = self.extract_key_takeaways(transcript_text, word_frequency)

        # Analyze performance
        performance_stats = self.analyze_performance(attempts_data)

        # Generate attempt breakdown
        attempt_breakdown = self.generate_attempt_breakdown(attempts_data)

        # Create report
        report_id = str(uuid.uuid4())

        return {
            'report_id': report_id,
            'user_id': user_id,
            'video_id': video_id,
            'quiz_id': quiz_id,
            'word_frequency': word_frequency,
            'performance_stats': performance_stats,
            'attempt_breakdown': attempt_breakdown,
            'key_takeaways': key_takeaways
        }


report_generator = ReportGenerator()
