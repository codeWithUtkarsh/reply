# PrepLM Video Learning - Step-by-Step Setup Guide

This guide will walk you through setting up the PrepLM Video Learning Platform from scratch.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Python 3.9 or higher installed
- [ ] Node.js 18 or higher installed
- [ ] npm or yarn package manager
- [ ] Git installed
- [ ] A Supabase account (free tier works)
- [ ] An OpenAI API account with credits

## Step 1: Get API Keys

### OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy and save the key (starts with `sk-`)

**Note**: You'll need a small amount of credits (~$5 recommended for testing)

### Supabase Setup

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click "New Project"
4. Fill in project details:
   - Name: `preplm-video-learning`
   - Database Password: (create a strong password)
   - Region: (choose closest to you)
5. Wait for project to be created (2-3 minutes)
6. Once ready, go to Project Settings > API
7. Copy:
   - `Project URL` (looks like: https://xxxxx.supabase.co)
   - `anon/public` key (looks like: eyJhbG...)

## Step 2: Clone and Setup Project

```bash
# Clone the repository
git clone <repository-url>
cd reply

# Verify directory structure
ls -la
# You should see: backend/ frontend/ README.md
```

## Step 3: Backend Setup

### Install Python Dependencies

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configure Backend Environment

```bash
# Copy example environment file
cp .env.example .env

# Open .env in your text editor
nano .env  # or use: code .env, vim .env, etc.
```

Fill in your credentials:

```env
# Replace these with your actual keys
OPENAI_API_KEY=sk-your-actual-openai-key-here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-actual-anon-key-here

# These can stay as default
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3000
MAX_VIDEO_DURATION=3600
FLASHCARD_INTERVAL=120
QUESTIONS_PER_SEGMENT=1
FINAL_QUIZ_QUESTIONS=10
```

Save and close the file.

## Step 4: Database Setup

### Create Database Tables

1. Open your Supabase project dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of `backend/supabase_schema.sql`
5. Paste into the SQL editor
6. Click "Run" or press Ctrl+Enter

You should see: "Success. No rows returned"

### Verify Tables Created

1. Navigate to "Table Editor" in Supabase
2. You should see these tables:
   - videos
   - questions
   - quizzes
   - user_progress
   - quiz_results

## Step 5: Test Backend

```bash
# Make sure you're in backend directory with venv activated
cd backend
source venv/bin/activate  # if not already activated

# Run the server
python main.py
```

You should see:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Test API

Open a new terminal and test:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected response: {"status":"healthy"}
```

Or visit in browser: `http://localhost:8000/docs` to see the API documentation.

**Keep this terminal running!**

## Step 6: Frontend Setup

Open a **new terminal** (keep backend running in the other).

```bash
# Navigate to frontend from project root
cd frontend

# Install dependencies
npm install
# This will take 2-3 minutes
```

### Configure Frontend Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Open .env.local in your text editor
nano .env.local
```

Fill in your credentials:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

**Important**: Use the same Supabase credentials as in backend!

Save and close the file.

## Step 7: Run Frontend

```bash
# Make sure you're in frontend directory
cd frontend

# Start development server
npm run dev
```

You should see:
```
   ▲ Next.js 14.0.3
   - Local:        http://localhost:3000
   - Ready in 2.3s
```

## Step 8: Test the Application

1. Open browser to `http://localhost:3000`
2. You should see the PrepLM Video Learning home page

### Test with a Video

1. Find a short educational YouTube video (5-10 minutes)
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
2. Paste the URL in the input field
3. Click "Start Learning"
4. Wait for processing (may take 10-30 seconds)
5. You should be redirected to the learning page with:
   - Video player
   - Progress tracker
   - Upcoming flashcards listed

## Troubleshooting

### Problem: "Module not found" errors in backend

**Solution**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

### Problem: Frontend build errors

**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Problem: "CORS error" in browser console

**Solution**:
- Check `CORS_ORIGINS` in `backend/.env` includes `http://localhost:3000`
- Restart backend server after changing .env

### Problem: "OpenAI API key invalid"

**Solution**:
- Verify key in `backend/.env` starts with `sk-`
- No spaces before or after the key
- Key is not expired (check OpenAI dashboard)

### Problem: Database connection fails

**Solution**:
- Verify Supabase URL and key in both `.env` files
- Check Supabase project is running (not paused)
- Ensure SQL schema was executed successfully

### Problem: Video not loading

**Solution**:
- Try a different video URL
- For YouTube, ensure video is public (not private/unlisted)
- Check browser console for errors

## Next Steps

### Customize Settings

Edit `backend/.env` to customize:
- `FLASHCARD_INTERVAL`: Change how often flashcards appear (in seconds)
- `FINAL_QUIZ_QUESTIONS`: Change number of quiz questions
- `MAX_VIDEO_DURATION`: Set max video length

### Using Custom Videos

The app supports:
- YouTube URLs
- Direct video URLs (.mp4, .webm, etc.)
- Vimeo (with yt-dlp support)

### Production Deployment

See `DEPLOYMENT.md` for instructions on deploying to:
- Railway (backend)
- Vercel (frontend)
- Docker containers

## Development Tips

### Backend Changes

After changing backend code:
1. Stop server (Ctrl+C)
2. Restart with `python main.py`

### Frontend Changes

Next.js has hot reload - changes appear automatically. If not:
1. Stop server (Ctrl+C)
2. Clear `.next` cache: `rm -rf .next`
3. Restart: `npm run dev`

### Database Changes

After modifying `supabase_schema.sql`:
1. Run the new SQL in Supabase SQL Editor
2. Or use migrations with Supabase CLI

## Getting Help

1. Check `README.md` for detailed documentation
2. Review API docs at `http://localhost:8000/docs`
3. Check browser console for frontend errors
4. Check terminal for backend errors
5. Create an issue on GitHub

## Success Checklist

- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 3000
- [ ] Can access home page in browser
- [ ] Can submit a video URL
- [ ] Video processes without errors
- [ ] Flashcards appear during playback
- [ ] Can answer flashcard questions
- [ ] Can take final quiz
- [ ] Quiz results display correctly

If all checkboxes are checked, congratulations! Your setup is complete! 🎉

## Quick Start Commands (After Initial Setup)

Save these for future use:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open browser to: `http://localhost:3000`
