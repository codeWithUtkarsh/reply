#!/bin/bash

# Reset Database Script
# This script generates SQL to clear all tables and recreate the database schema

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
echo "=================================================="
echo "STEP 1: Drop All Tables"
echo "=================================================="
echo ""
echo "📋 Copy and run the following SQL in your Supabase SQL Editor:"
echo ""
echo "-------------------------------------------------------------------"

cat <<'EOF'
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

-- Drop trigger and function
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
EOF

echo "-------------------------------------------------------------------"
echo ""
read -p "Press Enter after you've run the drop script in Supabase SQL Editor..."

echo ""
echo "=================================================="
echo "STEP 2: Create New Schema"
echo "=================================================="
echo ""
echo "📋 Now run the schema file in your Supabase SQL Editor:"
echo ""
echo "   File: backend/supabase_schema.sql"
echo ""
echo "You can either:"
echo "  1. Copy the contents of backend/supabase_schema.sql"
echo "  2. Or run this command to view it:"
echo "     cat backend/supabase_schema.sql"
echo ""
read -p "Press Enter after you've run the schema in Supabase SQL Editor..."

echo ""
echo "=================================================="
echo "✅ Database Reset Complete!"
echo "=================================================="
echo ""
echo "Your database has been reset with the new three-level hierarchy:"
echo ""
echo "  Projects → Topics → Videos"
echo ""
echo "Next steps:"
echo "  1. Start backend:  cd backend && python main.py"
echo "  2. Start frontend: cd frontend && npm run dev"
echo "  3. Create projects, then topics, then add videos"
echo ""
echo "Example workflow:"
echo "  - Create Project: 'Machine Learning Course'"
echo "  - Create Topic: 'Neural Networks' (in that project)"
echo "  - Add Videos: Process YouTube videos into that topic"
echo ""
echo "=================================================="
