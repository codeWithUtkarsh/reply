import os
from openai import OpenAI
import json
from typing import Dict, List
import uuid


class NotesGenerator:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
        # Truncate transcript if too long (keep first 8000 chars for context)
        text_sample = transcript_text[:8000] if len(transcript_text) > 8000 else transcript_text

        prompt = f"""You are an expert note-taker creating comprehensive, visually engaging notes for students.

Video Title: {video_title}

Transcript:
{text_sample}

Create detailed notes following these requirements:

1. STRUCTURE:
   - Create 4-6 main sections with clear headings
   - Each section should have concise, bullet-point style content
   - Use casual, student-friendly language (like handwritten notes)

2. DIAGRAMS:
   - Include Mermaid diagrams where helpful (flowcharts, mind maps, sequences, graphs)
   - Use diagrams to visualize:
     * Processes and workflows
     * Hierarchies and relationships
     * Comparisons and contrasts
     * Step-by-step procedures
   - Include 2-4 diagrams total

3. MERMAID SYNTAX:
   - Use proper Mermaid syntax for diagrams
   - Supported types: flowchart, sequenceDiagram, classDiagram, stateDiagram, mindmap
   - Keep diagrams simple and clear

4. STYLE:
   - Write in a casual, note-taking style
   - Use abbreviations where appropriate (w/, b/c, etc.)
   - Include key terms, definitions, and examples
   - Add helpful tips or "Pro tips" sections

Return your response as a JSON object with this structure:
{{
  "title": "Main topic/title for these notes",
  "sections": [
    {{
      "heading": "Section heading",
      "content": "Bullet points and notes content...",
      "diagrams": [
        {{
          "type": "mermaid",
          "code": "graph TD\\n  A[Start] --> B[Process]",
          "caption": "Brief description of diagram"
        }}
      ]
    }}
  ]
}}

Make the notes comprehensive but concise. Focus on key concepts and actionable insights."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert note-taker who creates engaging, visual notes with diagrams. You understand Mermaid diagram syntax and use it effectively to visualize concepts."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
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
