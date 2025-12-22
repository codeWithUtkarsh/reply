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

4. MERMAID SYNTAX EXAMPLES (USE EXACTLY THIS FORMAT):

   Flowchart (MOST RELIABLE):
   graph TD
       A[Start] --> B[Step 1]
       B --> C[Step 2]
       C --> D[End]

   Simple Flowchart with Decision:
   graph LR
       A[Input] --> B{Check}
       B -->|Yes| C[Process]
       B -->|No| D[Skip]
       C --> E[Output]
       D --> E

   Mind Map (for hierarchies):
   mindmap
     root((Main Topic))
       Concept 1
         Detail A
         Detail B
       Concept 2
         Detail C
         Detail D

   CRITICAL: Use simple node names (A, B, C) and clear labels in [brackets]

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
          "code": "graph TD\\n    A[Start] --> B[Process]\\n    B --> C[End]",
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
          "code": "graph LR\\n    A[Method 1] --> B[Result A]\\n    C[Method 2] --> D[Result B]",
          "caption": "Comparison of methods"
        }}
      ]
    }}
  ]
}}

IMPORTANT DIAGRAM RULES:
- Use simple graph TD (top-down) or graph LR (left-right)
- Keep node names short: A, B, C, D (not long names)
- Use [Square brackets] for labels
- Use --> for arrows
- Always include \\n for newlines in code
- Test that your syntax is valid Mermaid format

CRITICAL REQUIREMENTS:
- Each section MUST have at least 1 diagram
- Content MUST use proper line breaks (\\n\\n between points)
- Minimum 2-3 diagrams total across all sections
- Diagrams must use valid Mermaid syntax
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
