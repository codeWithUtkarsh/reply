#!/bin/bash

# Reset Database Script
# This script clears all tables and recreates the database schema from scratch

set -e  # Exit on error

echo "=================================================="
echo "DATABASE RESET SCRIPT"
echo "=================================================="
echo ""
echo "⚠️  WARNING: This will DELETE ALL DATA in your database!"
echo "This includes:"
echo "  - All users (except auth.users)"
echo "  - All projects"
echo "  - All topics"
echo "  - All videos"
echo "  - All questions, quizzes, progress, etc."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Reading Supabase credentials from backend/.env..."

# Load environment variables
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found!"
    echo "Please create backend/.env with your Supabase credentials."
    exit 1
fi

# Extract Supabase URL and Service Role Key from .env
export $(grep -v '^#' backend/.env | xargs)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL or SUPABASE_KEY not found in backend/.env"
    exit 1
fi

echo "✅ Loaded Supabase credentials"
echo ""
echo "=================================================="
echo "Step 1: Dropping all tables..."
echo "=================================================="

# Create SQL script to drop all tables
cat > /tmp/drop_tables.sql <<EOF
-- Drop tables in reverse order of dependencies

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Users can view topics in own projects" ON topics;
DROP POLICY IF EXISTS "Users can create topics in own projects" ON topics;
DROP POLICY IF EXISTS "Users can update topics in own projects" ON topics;
DROP POLICY IF EXISTS "Users can delete topics in own projects" ON topics;
DROP POLICY IF EXISTS "Users can view videos in their topics" ON videos;
DROP POLICY IF EXISTS "Allow video creation" ON videos;
DROP POLICY IF EXISTS "Users can view their topic-video links" ON topic_videos;
DROP POLICY IF EXISTS "Users can link videos to their topics" ON topic_videos;
DROP POLICY IF EXISTS "Users can remove videos from their topics" ON topic_videos;
DROP POLICY IF EXISTS "Allow all operations on questions" ON questions;
DROP POLICY IF EXISTS "Allow all operations on quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can access own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can access own quiz results" ON quiz_results;
DROP POLICY IF EXISTS "Users can access own attempts" ON user_attempts;
DROP POLICY IF EXISTS "Users can access own reports" ON learning_reports;
DROP POLICY IF EXISTS "Allow all operations on video_notes" ON video_notes;
DROP POLICY IF EXISTS "Users can access own activity log" ON activity_log;

-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop tables
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS video_notes CASCADE;
DROP TABLE IF EXISTS learning_reports CASCADE;
DROP TABLE IF EXISTS user_attempts CASCADE;
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS topic_videos CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Note: We don't drop auth.users as it's managed by Supabase Auth
EOF

echo "Executing drop script..."

# We'll use psql if available, otherwise provide manual instructions
if command -v psql &> /dev/null; then
    # Extract database connection details from Supabase URL
    DB_HOST=$(echo $SUPABASE_URL | sed -n 's/.*https:\/\/\([^\.]*\)\..*/\1/p')

    echo "Note: Direct psql connection requires database password."
    echo "Alternatively, run the SQL in Supabase SQL Editor:"
    echo ""
    cat /tmp/drop_tables.sql
    echo ""
else
    echo ""
    echo "⚠️  psql not found. Please run the following SQL in your Supabase SQL Editor:"
    echo ""
    cat /tmp/drop_tables.sql
    echo ""
    read -p "Press Enter after you've run the drop script in Supabase SQL Editor..."
fi

echo ""
echo "=================================================="
echo "Step 2: Recreating schema..."
echo "=================================================="

echo ""
echo "📋 Please run the following SQL in your Supabase SQL Editor:"
echo ""
echo "   1. Go to: $SUPABASE_URL"
echo "   2. Navigate to SQL Editor"
echo "   3. Copy and paste the contents of: backend/supabase_schema.sql"
echo "   4. Click 'Run'"
echo ""
read -p "Press Enter after you've run the schema in Supabase SQL Editor..."

echo ""
echo "=================================================="
echo "✅ Database Reset Complete!"
echo "=================================================="
echo ""
echo "Your database has been reset with a fresh schema."
echo "You can now:"
echo "  1. Start the backend: cd backend && python main.py"
echo "  2. Start the frontend: cd frontend && npm run dev"
echo "  3. Create new projects and topics"
echo ""
echo "Note: All previous data has been deleted."
echo "=================================================="
EOF