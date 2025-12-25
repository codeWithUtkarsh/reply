from typing import List, Dict, Optional
import re
from collections import Counter
import uuid
from openai import OpenAI
from config import settings
import json
import asyncio


class ReportGenerator:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
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
            'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'now', 'video'
        }

    async def extract_semantic_keywords(self, transcript_text: str) -> Dict:
        """
        Use AI to extract semantically relevant keywords and classify video type
        Returns: {
            'keywords': {word: importance_score},
            'video_type': str,
            'main_topics': [str],
            'domain': str
        }
        """
        # Truncate transcript if too long (keep first 3000 chars for context)
        text_sample = transcript_text[:3000] if len(transcript_text) > 3000 else transcript_text

        prompt = f"""Analyze the following video transcript and provide:

1. Video Type Classification (e.g., Educational, Tutorial, News, Entertainment, Documentary, Review, etc.)
2. Main Domain/Subject (e.g., Technology, Science, Business, Health, etc.)
3. Top 30 semantically important keywords with their relative importance (1-100)
4. 3-5 main topics covered

Transcript:
{text_sample}

Return your analysis in JSON format:
{{
  "video_type": "Educational/Tutorial/News/etc",
  "domain": "Technology/Science/etc",
  "keywords": {{"keyword1": 95, "keyword2": 88, ...}},
  "main_topics": ["topic1", "topic2", "topic3"]
}}

Focus on:
- Technical terms and domain-specific vocabulary
- Key concepts and important entities
- Action words that indicate main activities
- Avoid generic words like "video", "today", "going", etc.
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing video content and extracting key semantic information. You identify important keywords, classify content type, and understand domain-specific terminology."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)

            # Ensure keywords are in the right format
            if 'keywords' in result and isinstance(result['keywords'], dict):
                # Normalize scores to be between 20 and 100 for better word cloud visualization
                max_score = max(result['keywords'].values()) if result['keywords'] else 100
                normalized_keywords = {
                    k: max(20, int((v / max_score) * 100))
                    for k, v in result['keywords'].items()
                }
                result['keywords'] = normalized_keywords

            return result

        except Exception as e:
            print(f"AI keyword extraction failed: {e}")
            # Fallback to traditional method
            return {
                'video_type': 'General',
                'domain': 'Mixed',
                'keywords': self.generate_word_frequency(transcript_text, 30),
                'main_topics': []
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

    def _calculate_quiz_average_score(self, attempts_data: List[Dict]) -> float:
        """
        Calculate average quiz score across all quiz attempts.

        For each quiz (identified by quiz_id), calculate:
        - Individual quiz score = (correct answers / total questions) * 100

        Then average across all quiz attempts (to handle retakes).

        Returns the average quiz score as a percentage.
        """
        # Get only quiz attempts that have a quiz_id
        quiz_attempts = [a for a in attempts_data if a.get('question_type') == 'quiz' and a.get('quiz_id')]

        if not quiz_attempts:
            return 0.0

        # Group attempts by quiz_id
        quiz_scores = {}
        for attempt in quiz_attempts:
            quiz_id = attempt['quiz_id']
            if quiz_id not in quiz_scores:
                quiz_scores[quiz_id] = {'correct': 0, 'total': 0}

            quiz_scores[quiz_id]['total'] += 1
            if attempt['is_correct']:
                quiz_scores[quiz_id]['correct'] += 1

        # Calculate score for each quiz
        individual_scores = []
        for quiz_id, stats in quiz_scores.items():
            if stats['total'] > 0:
                score = (stats['correct'] / stats['total']) * 100
                individual_scores.append(score)

        # Return average of all quiz scores
        if individual_scores:
            return round(sum(individual_scores) / len(individual_scores), 2)
        return 0.0

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
                'quiz_average_score': 0,
                'by_question': {}
            }

        total_attempts = len(attempts_data)
        correct_count = sum(1 for attempt in attempts_data if attempt['is_correct'])
        incorrect_count = total_attempts - correct_count

        # Calculate average quiz score (for quiz type attempts only)
        quiz_average_score = self._calculate_quiz_average_score(attempts_data)

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
            'quiz_average_score': quiz_average_score,  # Average of individual quiz scores
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

    async def analyze_weak_areas(self, attempts_data: List[Dict], questions_data: List[Dict], transcript_text: str) -> Dict:
        """
        Analyze weak areas based on incorrect answers using AI
        Returns weak concepts, mastery levels, and learning recommendations
        """
        # Get incorrect attempts with their question context
        incorrect_attempts = [a for a in attempts_data if not a['is_correct']]

        if not incorrect_attempts:
            return {
                'weak_concepts': [],
                'mastery_analysis': {
                    'mastered': [],
                    'learning': [],
                    'needs_review': []
                },
                'knowledge_gaps': [],
                'recommendations': []
            }

        # Build question map
        question_map = {q.get('id') or q.get('question_id'): q for q in questions_data}

        # Get questions that were answered incorrectly
        weak_questions = []
        for attempt in incorrect_attempts:
            q_id = attempt['question_id']
            if q_id in question_map:
                q_data = question_map[q_id]
                # Extract question text (handle both quiz and flashcard formats)
                try:
                    # Try quiz question format first (has question_text directly)
                    if 'question_text' in q_data:
                        weak_questions.append(q_data['question_text'])
                    # Try flashcard format (has question_data)
                    elif isinstance(q_data.get('question_data'), dict):
                        weak_questions.append(q_data['question_data'].get('question', ''))
                    elif isinstance(q_data.get('question_data'), str):
                        parsed = json.loads(q_data['question_data'])
                        weak_questions.append(parsed.get('question', ''))
                except:
                    pass

        if not weak_questions:
            return {
                'weak_concepts': [],
                'mastery_analysis': {'mastered': [], 'learning': [], 'needs_review': []},
                'knowledge_gaps': [],
                'recommendations': []
            }

        # Use AI to analyze growth areas (positive framing)
        prompt = f"""You are a supportive learning coach. Analyze this student's learning data to identify growth opportunities:

Video Content Summary (first 1500 chars):
{transcript_text[:1500]}

Questions to practice more:
{chr(10).join(f"{i+1}. {q}" for i, q in enumerate(weak_questions[:10]))}

Student progress: {len(attempts_data) - len(incorrect_attempts)} correct, {len(incorrect_attempts)} to improve on

Provide a growth-oriented analysis in JSON format:
{{
  "weak_concepts": [
    {{"concept": "specific topic", "severity": "high/medium/low", "description": "strengthening this will help you [benefit]"}}
  ],
  "knowledge_gaps": ["opportunity 1", "opportunity 2"],
  "recommendations": [
    {{"topic": "specific topic", "reason": "mastering this will unlock [concrete benefit]", "priority": "high/medium/low"}}
  ]
}}

IMPORTANT:
1. Use positive, growth-oriented language
2. Focus on benefits, not deficits ("strengthen" not "weak", "opportunity" not "gap")
3. Connect to bigger goals (why does mastering this matter?)
4. Be specific and actionable
5. Prioritize by impact on overall learning
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational analyst who identifies learning gaps and provides personalized recommendations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            analysis = json.loads(response.choices[0].message.content)

            # Calculate mastery levels based on performance
            mastery_analysis = self._calculate_mastery_levels(attempts_data, questions_data)
            analysis['mastery_analysis'] = mastery_analysis

            return analysis

        except Exception as e:
            print(f"AI weak area analysis failed: {e}")
            return {
                'weak_concepts': [],
                'mastery_analysis': {'mastered': [], 'learning': [], 'needs_review': []},
                'knowledge_gaps': [],
                'recommendations': []
            }

    def _calculate_mastery_levels(self, attempts_data: List[Dict], questions_data: List[Dict]) -> Dict:
        """
        Calculate which knowledge areas are mastered, learning, or need review.

        Note: Currently each question represents a knowledge area/concept from flashcards.
        In the future, quiz questions may come from multiple videos/sources beyond the current video.

        Knowledge areas are classified based on accuracy:
        - Mastered: 80%+ accuracy
        - Learning: 50-79% accuracy
        - Needs Review: <50% accuracy

        This helps focus user attention on weaker knowledge areas for improvement.
        """
        # Group attempts by question to calculate per-knowledge-area accuracy
        question_performance = {}
        for attempt in attempts_data:
            q_id = attempt['question_id']
            if q_id not in question_performance:
                question_performance[q_id] = {'correct': 0, 'total': 0}
            question_performance[q_id]['total'] += 1
            if attempt['is_correct']:
                question_performance[q_id]['correct'] += 1

        mastered = []
        learning = []
        needs_review = []

        for q_id, perf in question_performance.items():
            accuracy = perf['correct'] / perf['total'] if perf['total'] > 0 else 0

            # Find question to get knowledge area/concept
            question = next((q for q in questions_data if (q.get('id') or q.get('question_id')) == q_id), None)
            if question:
                # Extract concept from question (handle both quiz and flashcard formats)
                try:
                    # Try quiz question format first (has question_text directly)
                    if 'question_text' in question:
                        concept = question['question_text'][:100]
                    # Try flashcard format (has question_data)
                    elif isinstance(question.get('question_data'), dict):
                        concept = question['question_data'].get('question', '')[:100]
                    elif isinstance(question.get('question_data'), str):
                        parsed = json.loads(question['question_data'])
                        concept = parsed.get('question', '')[:100]
                    else:
                        concept = f"Knowledge area from question {q_id}"
                except:
                    concept = f"Knowledge area from question {q_id}"

                if accuracy >= 0.8:  # 80%+ correct - Mastered
                    mastered.append({'concept': concept, 'accuracy': round(accuracy * 100, 1)})
                elif accuracy >= 0.5:  # 50-79% correct - Learning
                    learning.append({'concept': concept, 'accuracy': round(accuracy * 100, 1)})
                else:  # < 50% correct - Needs Review (focus here!)
                    needs_review.append({'concept': concept, 'accuracy': round(accuracy * 100, 1)})

        return {
            'mastered': mastered[:10],  # Top 10 mastered knowledge areas
            'learning': learning[:10],   # Top 10 in-progress knowledge areas
            'needs_review': needs_review[:10]  # Top 10 knowledge areas needing review (weaker areas to focus on)
        }

    async def generate_learning_path(self, weak_concepts: List[Dict], main_topics: List[str], domain: str) -> Dict:
        """
        Generate a visual learning path showing what to learn next
        Uses AI to create a structured learning roadmap
        """
        if not weak_concepts and not main_topics:
            return {'nodes': [], 'edges': [], 'next_steps': []}

        prompt = f"""Create a learning path/roadmap for a student who:

Domain: {domain}
Main Topics Covered: {', '.join(main_topics)}
Weak Areas: {', '.join([w['concept'] for w in weak_concepts[:5]])}

Generate a structured learning path in JSON format:
{{
  "learning_path": [
    {{
      "step": 1,
      "topic": "Topic Name",
      "status": "completed/in_progress/not_started",
      "description": "Why this is important",
      "estimated_time": "X hours"
    }}
  ],
  "next_steps": [
    {{
      "priority": 1,
      "topic": "Immediate next topic to learn",
      "reason": "Why this should be next",
      "prerequisites": ["prereq1", "prereq2"]
    }}
  ],
  "circuit_map": [
    {{
      "id": "node1",
      "label": "Topic Name",
      "status": "mastered/learning/locked",
      "connections": ["node2", "node3"]
    }}
  ]
}}

Create a logical progression from basics to advanced concepts.
Mark topics they've covered as "completed" or "in_progress" based on weak areas.
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert curriculum designer who creates personalized learning paths."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.4,
                response_format={"type": "json_object"}
            )

            path = json.loads(response.choices[0].message.content)
            return path

        except Exception as e:
            print(f"Learning path generation failed: {e}")
            return {'learning_path': [], 'next_steps': [], 'circuit_map': []}

    async def generate_report(
        self,
        user_id: str,
        video_id: str,
        quiz_id: str,
        transcript_text: str,
        attempts_data: List[Dict],
        questions_data: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Generate comprehensive learning report with AI-powered insights
        """
        # Use AI to extract semantic keywords and classify video
        semantic_analysis = await self.extract_semantic_keywords(transcript_text)

        # Analyze performance
        performance_stats = self.analyze_performance(attempts_data)

        # Generate attempt breakdown
        attempt_breakdown = self.generate_attempt_breakdown(attempts_data)

        # NEW: Analyze weak areas and knowledge gaps
        weak_area_analysis = await self.analyze_weak_areas(
            attempts_data,
            questions_data or [],
            transcript_text
        )

        # NEW: Generate learning path based on weak areas
        learning_path = await self.generate_learning_path(
            weak_area_analysis.get('weak_concepts', []),
            semantic_analysis.get('main_topics', []),
            semantic_analysis.get('domain', 'General')
        )

        # Generate AI-powered key takeaways (moved to top priority)
        key_takeaways = await self._generate_ai_takeaways(
            transcript_text,
            performance_stats,
            weak_area_analysis
        )

        # NEW: Generate video recommendations for weak areas
        video_recommendations = await self.generate_video_recommendations(
            weak_area_analysis.get('weak_concepts', []),
            semantic_analysis.get('domain', 'General'),
            semantic_analysis.get('main_topics', [])
        )

        # Create report
        report_id = str(uuid.uuid4())

        return {
            'report_id': report_id,
            'user_id': user_id,
            'video_id': video_id,
            'quiz_id': quiz_id,

            # Priority 1: Executive Summary (NEW - at the top!)
            'key_takeaways': key_takeaways,
            'executive_summary': {
                'overall_score': performance_stats['quiz_average_score'],  # Average of individual quiz scores
                'status': 'excellent' if performance_stats['quiz_average_score'] >= 80 else 'good' if performance_stats['quiz_average_score'] >= 60 else 'needs_improvement',
                'time_spent': len(attempts_data),  # Could be enhanced with actual time tracking
                'topics_mastered': len(weak_area_analysis.get('mastery_analysis', {}).get('mastered', [])),
                'topics_in_progress': len(weak_area_analysis.get('mastery_analysis', {}).get('learning', [])),
                'topics_to_review': len(weak_area_analysis.get('mastery_analysis', {}).get('needs_review', []))
            },

            # Priority 2: Weak Areas & Recommendations (NEW!)
            'weak_areas': weak_area_analysis,

            # Priority 3: Video Recommendations (NEW!)
            'video_recommendations': video_recommendations,

            # Priority 4: Learning Path (NEW!)
            'learning_path': learning_path,

            # Priority 5: Performance Stats (existing)
            'performance_stats': performance_stats,
            'attempt_breakdown': attempt_breakdown,

            # Priority 6: Content Analysis (existing)
            'word_frequency': semantic_analysis.get('keywords', {}),
            'video_type': semantic_analysis.get('video_type', 'General'),
            'domain': semantic_analysis.get('domain', 'Mixed'),
            'main_topics': semantic_analysis.get('main_topics', []),

            # Priority 7: Raw attempts data for study pattern visualization
            'attempts_data': attempts_data
        }

    async def _generate_ai_takeaways(self, transcript_text: str, performance_stats: Dict, weak_area_analysis: Dict) -> List[str]:
        """Generate personalized, actionable insights using AI"""
        prompt = f"""You are a motivating learning coach. Generate 5 personalized insights for this student:

Video Content (first 1500 chars):
{transcript_text[:1500]}

Student Performance:
- Accuracy: {performance_stats['accuracy_rate']}%
- Correct: {performance_stats['correct_count']}/{performance_stats['total_attempts']}

Growth Areas:
{json.dumps(weak_area_analysis.get('weak_concepts', [])[:3], indent=2)}

Mastered Topics:
{json.dumps(weak_area_analysis.get('mastery_analysis', {}).get('mastered', [])[:3], indent=2)}

Generate insights that:
1. START with what they did well (celebrate wins first!)
2. Frame challenges as opportunities, not failures
3. Include specific, actionable next steps
4. Connect learning to bigger goals
5. Are motivating and supportive

Return as JSON: {{"takeaways": ["insight1", "insight2", ...]}}

Examples of GOOD insights:
- "You've mastered arrays with 90% accuracy! This foundation will make learning linked lists much easier."
- "Practice binary search trees for 20 minutes to unlock advanced algorithm skills."
- "Your understanding of loops is strong - build on this by tackling recursion next."

Examples of BAD insights (avoid these):
- "You got 3 questions wrong on trees." (too negative)
- "Review the material." (not specific)
- "Weak in recursion." (not actionable)
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a supportive learning coach."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            return result.get('takeaways', [])
        except Exception as e:
            print(f"AI takeaways generation failed: {e}")
            # Fallback to existing method
            return self.extract_key_takeaways(transcript_text, {})

    async def generate_video_recommendations(self, weak_concepts: List[Dict], domain: str, main_topics: List[str]) -> List[Dict]:
        """
        Generate YouTube video recommendations for weak areas
        Returns search queries and recommended video topics
        """
        if not weak_concepts:
            return []

        # Extract high-priority weak concepts
        high_priority_concepts = [
            w for w in weak_concepts
            if w.get('severity') in ['high', 'medium']
        ][:5]

        if not high_priority_concepts:
            high_priority_concepts = weak_concepts[:3]

        prompt = f"""You are an expert at finding educational content. Recommend specific YouTube videos for a student:

Domain: {domain}
Topics: {', '.join(main_topics)}

Growth Areas:
{json.dumps(high_priority_concepts, indent=2)}

For each area, recommend 1-2 SPECIFIC, POPULAR YouTube videos that actually exist.

Return as JSON:
{{
  "recommendations": [
    {{
      "concept": "topic name",
      "search_queries": [
        {{
          "query": "Actual popular video title (e.g., 'Binary Search Tree - Abdul Bari')",
          "video_type": "Tutorial"
        }}
      ],
      "why_helpful": "This will help you [specific benefit]"
    }}
  ]
}}

IMPORTANT:
- Recommend REAL, popular educational channels (CS Dojo, Abdul Bari, freeCodeCamp, etc.)
- Use specific, well-known video titles when possible
- Focus on beginner-friendly, highly-rated content
- Be specific: "Binary Search Trees Explained - CS Dojo" not "BST tutorial"
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at finding the best educational content for students' specific needs."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.4,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)

            # Enhance recommendations with YouTube search URLs
            recommendations = result.get('recommendations', [])
            for rec in recommendations:
                for query in rec.get('search_queries', []):
                    # Generate YouTube search URL
                    encoded_query = query['query'].replace(' ', '+')
                    query['youtube_search_url'] = f"https://www.youtube.com/results?search_query={encoded_query}"

            return recommendations

        except Exception as e:
            print(f"Video recommendations generation failed: {e}")
            # Fallback: generate basic search queries
            fallback_recs = []
            for concept in weak_concepts[:3]:
                concept_name = concept.get('concept', '')
                fallback_recs.append({
                    'concept': concept_name,
                    'search_queries': [
                        {
                            'query': f"{concept_name} tutorial",
                            'video_type': 'Tutorial',
                            'youtube_search_url': f"https://www.youtube.com/results?search_query={concept_name.replace(' ', '+')}+tutorial"
                        },
                        {
                            'query': f"{concept_name} explained",
                            'video_type': 'Explained',
                            'youtube_search_url': f"https://www.youtube.com/results?search_query={concept_name.replace(' ', '+')}+explained"
                        }
                    ],
                    'why_helpful': f"Learn more about {concept_name}"
                })
            return fallback_recs


report_generator = ReportGenerator()
