# PrepLM Video Learning Platform

An intelligent video-based learning application that uses AI to generate questions and test comprehension in real-time. As users watch educational videos, they receive flashcards at key moments and can take a comprehensive final quiz. When answers are incorrect, the system directs users to specific video timestamps for review.

## Features

- **Smart Video Processing**: Load videos from URLs (YouTube, direct links, etc.)
- **AI-Powered Questions**: OpenAI GPT-4o-mini generates contextual questions based on video content
- **Real-Time Flashcards**: Questions appear at strategic timestamps during video playback
- **Interactive Quizzes**: Comprehensive 10-question final quiz to test understanding
- **Timestamp Navigation**: Incorrect answers redirect users to relevant video segments
- **Progress Tracking**: Monitor learning progress with visual indicators
- **Modern UI**: Built with Next.js, React, and Tailwind CSS

## Architecture

### Backend (FastAPI)
```
backend/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration management
├── models.py              # Pydantic data models
├── database.py            # Supabase integration
├── requirements.txt       # Python dependencies
├── routes/
│   ├── video.py          # Video processing endpoints
│   ├── questions.py      # Question management endpoints
│   └── quiz.py           # Quiz generation and submission
└── services/
    ├── video_processor.py    # Video URL handling and metadata extraction
    ├── whisper_service.py    # Video transcription (OpenAI Whisper)
    └── question_generator.py # AI question generation
```

### Frontend (Next.js)
```
frontend/
├── app/
│   ├── page.tsx              # Home page (video URL input)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── learn/[videoId]/
│       └── page.tsx          # Main learning interface
├── components/
│   ├── VideoPlayer.tsx       # Custom video player with tracking
│   ├── FlashCardModal.tsx    # Flashcard question modal
│   └── QuizComponent.tsx     # Final quiz interface
└── lib/
    ├── api.ts                # API client functions
    └── utils.ts              # Utility functions
```

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **OpenAI API**: GPT-4o-mini for question generation, Whisper for transcription
- **Supabase**: PostgreSQL database for data persistence
- **yt-dlp**: Video URL processing and metadata extraction
- **Pydantic**: Data validation and settings management

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client
- **Lucide React**: Icon library

## Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API key
- Supabase account and project

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd reply
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `backend/.env` with your credentials:
```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3000
```

### 3. Database Setup

Run the SQL schema in your Supabase project:

```bash
# In Supabase SQL Editor, run:
cat supabase_schema.sql
```

Or use the Supabase CLI:
```bash
supabase db push
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Running the Application

### Start Backend Server

```bash
cd backend
source venv/bin/activate
python main.py
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### 1. Submit a Video

1. Open `http://localhost:3000`
2. Paste a video URL (YouTube or direct video link)
3. Optionally enter a custom title
4. Click "Start Learning"

### 2. Watch and Learn

- The video will be processed and transcribed
- Flashcards appear at strategic timestamps during playback
- Answer questions to test your understanding
- Incorrect answers redirect you to relevant video segments

### 3. Take the Final Quiz

- After answering all flashcards, take the 10-question final quiz
- Review your results and identify weak areas
- Click on timestamp links to review specific concepts

## API Endpoints

### Video Processing
- `POST /api/video/process` - Process and transcribe video
- `GET /api/video/{video_id}` - Get video details
- `GET /api/video/{video_id}/direct-url` - Get playable video URL

### Questions
- `POST /api/questions/answer` - Submit flashcard answer
- `GET /api/questions/{video_id}/flashcards` - Get all flashcards

### Quiz
- `POST /api/quiz/generate` - Generate final quiz
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/quiz/{quiz_id}` - Get quiz details

## Configuration

### Backend Configuration (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_KEY` | Supabase anon key | Required |
| `BACKEND_PORT` | API server port | 8000 |
| `CORS_ORIGINS` | Allowed CORS origins | http://localhost:3000 |
| `MAX_VIDEO_DURATION` | Max video length (seconds) | 3600 |
| `FLASHCARD_INTERVAL` | Time between flashcards | 120 |
| `FINAL_QUIZ_QUESTIONS` | Number of quiz questions | 10 |

### Frontend Configuration (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

## Deployment

### Backend Deployment

**Option 1: Railway**
1. Connect your GitHub repository
2. Add environment variables
3. Deploy from `backend` directory

**Option 2: Docker**
```dockerfile
# backend/Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Deployment

**Vercel (Recommended)**
1. Import project from GitHub
2. Set root directory to `frontend`
3. Add environment variables
4. Deploy

**Environment Variables for Production:**
- `NEXT_PUBLIC_API_URL`: Your production API URL
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase key

## Cost Estimation

### OpenAI API Costs (per video)

**GPT-4o-mini** (Question Generation):
- Input: ~$0.15 per 1M tokens
- For a 30-minute video with 10 questions: ~$0.02

**Whisper** (Transcription):
- $0.006 per minute
- For a 30-minute video: ~$0.18

**Total per 30-min video**: ~$0.20

### Alternative AI Models (Lower Cost)

- **Anthropic Claude Haiku**: ~$0.25 per 1M input tokens
- **Google Gemini Flash**: Free tier available
- **OpenAI GPT-3.5-turbo**: ~$0.0005 per 1K tokens

## Troubleshooting

### Video Processing Issues

**Problem**: Video URL not loading
- Ensure URL is publicly accessible
- Check if yt-dlp supports the platform
- Try direct video URLs (.mp4, .webm)

**Problem**: Transcription fails
- Currently using simulated transcription
- For production, implement actual Whisper API call in `whisper_service.py`

### Database Connection Issues

**Problem**: Supabase connection fails
- Verify URL and API key
- Check RLS policies in Supabase dashboard
- Ensure database tables are created

### CORS Issues

**Problem**: Frontend can't connect to backend
- Update `CORS_ORIGINS` in backend `.env`
- Include your frontend URL

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Backend linting
cd backend
black .
flake8 .

# Frontend linting
cd frontend
npm run lint
```

## Roadmap

- [ ] Implement actual Whisper API transcription
- [ ] Add user authentication
- [ ] Support for multiple languages
- [ ] Video bookmarking and notes
- [ ] Spaced repetition for flashcards
- [ ] Mobile app (React Native)
- [ ] Export quiz results as PDF
- [ ] Social features (share videos, compete)
- [ ] Analytics dashboard for educators

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review API docs at `/docs` endpoint

## Acknowledgments

- OpenAI for GPT and Whisper APIs
- Supabase for backend infrastructure
- Next.js and Vercel teams
- yt-dlp contributors

---

Built with ❤️ for better learning experiences
