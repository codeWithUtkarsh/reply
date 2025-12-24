import os
from openai import OpenAI
import json
from typing import Dict, List
import uuid
from config import settings

class NotesGenerator:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    async def generate_notes(self, transcript_text: str, video_title: str) -> Dict:
        """
        Generate comprehensive notes with diagrams from video transcript

        Returns:
        {
            'notes_id': str,
            'title': str,
            'sections': [
                {
                    'heading': str,
                    'content': str,
                    'diagrams': [
                        {
                            'type': 'mermaid',
                            'code': str,
                            'caption': str
                        }
                    ]
                }
            ]
        }
        """
        # Truncate transcript if too long (keep first 10000 chars for better context)
        text_sample = transcript_text[:10000] if len(transcript_text) > 10000 else transcript_text

        prompt = f"""You are an expert note-taker creating comprehensive, visually engaging notes for students.

Video Title: {video_title}

Transcript:
{text_sample}

Create detailed notes following these STRICT requirements:

1. STRUCTURE:
   - Create exactly 4-6 main sections with clear headings
   - Each section MUST have concise, well-formatted content
   - Use casual, student-friendly language

2. CONTENT FORMATTING (CRITICAL):
   - Use proper line breaks between points
   - Each bullet point or new idea MUST be on a new line
   - Format like this:
     "• First point about the topic

     • Second point with explanation

     • Third point with details"

   - NOT like this: "First pointSecond pointThird point"
   - Add blank lines between paragraphs for readability
   - Use bullet points (•) or numbered lists (1., 2., 3.)

3. DIAGRAMS (MANDATORY):
   - You MUST include AT LEAST 2-3 Mermaid diagrams
   - Include diagrams for:
     * Main concepts and workflows
     * Hierarchies and relationships
     * Step-by-step processes
     * Comparisons or decision trees
   - Each diagram must be properly formatted Mermaid syntax
   - Keep diagrams simple but informative

4. MERMAID SYNTAX (CRITICAL - FOLLOW EXACTLY):

   ONLY use this ultra-simple format:
   graph TD
       A[Start]
       B[Step 1]
       C[Step 2]
       D[End]
       A --> B
       B --> C
       C --> D

   RULES:
   - ALWAYS use "graph TD" (top-down)
   - Node names: Single letters ONLY (A, B, C, D, E, F)
   - Labels: Short words in [brackets], NO special characters
   - Arrows: ALWAYS on separate lines after all nodes defined
   - NO decision diamonds, NO special shapes
   - Maximum 6 nodes per diagram
   - Keep it EXTREMELY simple

5. STYLE:
   - Write in a clear, note-taking style
   - Include key terms and definitions
   - Add examples where helpful
   - Use "Pro tip:" for important insights

EXAMPLE OUTPUT STRUCTURE:
{{
  "title": "Clear Topic Title",
  "sections": [
    {{
      "heading": "Understanding the Basics",
      "content": "• First key concept explained clearly\\n\\n• Second important point with details\\n\\n• Third point with examples\\n\\nPro tip: Remember this helpful insight!",
      "diagrams": [
        {{
          "type": "mermaid",
          "code": "graph TD\\n    A[Start]\\n    B[Process]\\n    C[End]\\n    A --> B\\n    B --> C",
          "caption": "Simple process flow"
        }}
      ]
    }},
    {{
      "heading": "Key Methods",
      "content": "1. First method:\\n   - Step A\\n   - Step B\\n\\n2. Second method:\\n   - Step C\\n   - Step D",
      "diagrams": [
        {{
          "type": "mermaid",
          "code": "graph TD\\n    A[Method1]\\n    B[Method2]\\n    C[Result]\\n    A --> C\\n    B --> C",
          "caption": "Comparison of methods"
        }}
      ]
    }}
  ]
}}

CRITICAL DIAGRAM RULES (MUST FOLLOW):
1. ALWAYS use "graph TD" (never LR, never flowchart)
2. Node names: ONLY A, B, C, D, E, F (single letters)
3. Define ALL nodes first, THEN arrows
4. Node labels: Short simple words ONLY, NO parentheses, NO symbols
5. Example format:
   graph TD
       A[Start]
       B[Process]
       C[End]
       A --> B
       B --> C
6. NO special characters (no μ, σ, π, parentheses, quotes)
7. Keep labels under 15 characters
8. Maximum 6 nodes per diagram
9. NO decision diamonds, NO special shapes, ONLY basic rectangles
10. Test your diagram follows this EXACT pattern

CRITICAL REQUIREMENTS:
- Each section should have 0-1 diagram (diagrams are optional)
- Only create diagram if it truly helps visualize the concept
- Content MUST use proper line breaks (\\n\\n between points)
- Diagrams must use the EXACT simple format shown above
- Make notes comprehensive but concise

Return your response as a valid JSON object with the exact structure shown above."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Upgraded from gpt-4o-mini for better quality
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational content creator who creates exceptionally clear, well-formatted notes with visual diagrams. You ALWAYS include proper formatting with line breaks and ALWAYS generate the requested diagrams using correct Mermaid syntax. You follow instructions precisely."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.5,  # Lowered from 0.7 for more consistent structure
                response_format={"type": "json_object"}
            )

            notes_data = json.loads(response.choices[0].message.content)

            # Add unique ID
            notes_data['notes_id'] = str(uuid.uuid4())

            # Ensure all sections have diagrams array (even if empty)
            for section in notes_data.get('sections', []):
                if 'diagrams' not in section:
                    section['diagrams'] = []

            return notes_data

        except Exception as e:
            print(f"Notes generation failed: {e}")
            # Return minimal notes on failure
            return {
                'notes_id': str(uuid.uuid4()),
                'title': video_title,
                'sections': [
                    {
                        'heading': 'Summary',
                        'content': 'Failed to generate detailed notes. Please try again.',
                        'diagrams': []
                    }
                ]
            }
