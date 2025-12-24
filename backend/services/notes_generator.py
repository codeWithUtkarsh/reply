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

        # Use triple quotes without f-string for the main template
        prompt_template = """You are an expert educational content designer creating comprehensive study materials from video content.

        INPUT:
        - Video Title: {video_title}
        - Transcript: {text_sample}

        OBJECTIVE: Transform this content into structured, visually-rich study notes with effective diagrams and visualizations.

        OUTPUT REQUIREMENTS:

        ## 1. CONTENT STRUCTURE
        Create 3-5 main sections based on the natural flow of the video content:
        - Each section should cover a distinct topic or concept
        - Sections should follow a logical progression
        - Balance detail with clarity (aim for 150-300 words per section)

        ## 2. VISUALIZATION STRATEGY
        Include 2-4 diagrams total, choosing the most appropriate type for each concept:

        ### Diagram Types (select based on content):
        - **Flow Diagrams**: For processes, sequences, or workflows
        - **Hierarchy Charts**: For organizational structures or classifications
        - **Concept Maps**: For showing relationships between ideas
        - **Timeline Diagrams**: For chronological information
        - **Comparison Charts**: For contrasting different approaches or options
        - **Cycle Diagrams**: For recurring processes or feedback loops

        ### Mermaid Syntax Guidelines:
```mermaid
        # For simple flows (preferred for most cases):
        graph TD
            A[Initial State] --> B[Process Step]
            B --> C{{Decision Point}}
            C -->|Yes| D[Outcome 1]
            C -->|No| E[Outcome 2]

        # For hierarchies:
        graph TD
            A[Main Concept] --> B[Subconcept 1]
            A --> C[Subconcept 2]
            B --> D[Detail 1]
            B --> E[Detail 2]

        # For timelines:
        graph LR
            A[Event 1] --> B[Event 2]
            B --> C[Event 3]
            C --> D[Event 4]
```

        ### Diagram Best Practices:
        - Use descriptive but concise labels (max 20 characters)
        - Limit to 8 nodes for clarity
        - Include decision points where relevant using {{curly braces}}
        - Add edge labels for clarity using |label| syntax
        - Choose graph direction (TD, LR, BT, RL) based on content flow

        ## 3. CONTENT FORMATTING
        Structure each section with:
        - **Clear heading** that captures the main idea
        - **Introduction sentence** providing context
        - **Key points** using bullets or numbered lists
        - **Examples or applications** where relevant
        - **Transitions** between sections for flow

        Use formatting elements:
        - `**Bold**` for key terms and definitions
        - Bullet points (•) for related items
        - Numbered lists (1., 2., 3.) for sequential steps
        - Block quotes for important insights or quotes
        - Code blocks for technical content if applicable

        ## 4. PEDAGOGICAL ELEMENTS
        Include where appropriate:
        - **Definitions**: Clear explanations of new terms
        - **Examples**: Concrete applications of abstract concepts
        - **Mnemonics**: Memory aids for complex information
        - **Connections**: Links to prior knowledge or related topics
        - **Summary points**: Key takeaways at section ends

        ## 5. OUTPUT FORMAT
        Return as JSON with this structure:
        {{
          "title": "string - engaging title reflecting core content",
          "summary": "string - 2-3 sentence overview of main points",
          "sections": [
            {{
              "heading": "string - section title",
              "content": "string - formatted text with proper markdown",
              "key_concepts": ["array", "of", "main", "terms"],
              "visualizations": [
                {{
                  "type": "mermaid|table|list",
                  "title": "string - diagram title",
                  "code": "string - mermaid syntax or structured data",
                  "purpose": "string - what this visualization illustrates"
                }}
              ]
            }}
          ],
          "review_questions": [
            "string - question to test understanding"
          ]
        }}

        ## QUALITY CRITERIA
        Your output should:
        1. **Accurately represent** the source material without distortion
        2. **Enhance understanding** through visual organization
        3. **Support different learning styles** (visual, textual, structural)
        4. **Enable quick review** through clear hierarchies and summaries
        5. **Promote retention** through meaningful connections and patterns

        ## DIAGRAM VALIDATION
        Before including any diagram, verify it:
        - Adds genuine value (not just decorative)
        - Simplifies complex relationships
        - Uses appropriate diagram type for the content
        - Has clear, readable labels
        - Follows proper Mermaid syntax

        Focus on creating study materials that would genuinely help a student understand and remember the content. Prioritize clarity and pedagogical value over complexity.
        """

        # Now format the prompt with the actual values
        prompt = prompt_template.format(
            video_title=video_title,
            text_sample=text_sample
        )

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
                # Also ensure backward compatibility with 'diagrams' vs 'visualizations'
                if 'visualizations' in section and 'diagrams' not in section:
                    section['diagrams'] = section['visualizations']

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