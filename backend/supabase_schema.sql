-- Supabase Database Schema for PrepLM Video Learning App

-- Users table (integrates with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('admin', 'user', 'supervisor')) DEFAULT 'user',
    scope JSONB DEFAULT '{}',
    company VARCHAR(255),
    credit_available INTEGER DEFAULT 0,
    subscription_id VARCHAR(255),
    country VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(255) NOT NULL,
    project_desc TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table (unique code from YouTube URL)
-- Videos are processed once and can belong to multiple projects
CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR(255) PRIMARY KEY, -- YouTube video ID (e.g., AL2GL2GUfHk)
    title TEXT NOT NULL,
    video_length FLOAT NOT NULL, -- duration in seconds
    transcript JSONB, -- NULL during processing
    url TEXT NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'processing', -- processing, transcribing, generating_flashcards, completed, failed
    error_message TEXT, -- Error details if processing failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project-Video junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS project_videos (
    id BIGSERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, video_id) -- A video can only be added once per project
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    question_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id BIGSERIAL PRIMARY KEY,
    quiz_id VARCHAR(255) UNIQUE NOT NULL,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    questions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    progress_data JSONB NOT NULL,
    last_timestamp FLOAT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Quiz results table
CREATE TABLE IF NOT EXISTS quiz_results (
    id BIGSERIAL PRIMARY KEY,
    quiz_id VARCHAR(255) NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score_percentage FLOAT NOT NULL,
    correct_answers INT NOT NULL,
    total_questions INT NOT NULL,
    details JSONB NOT NULL,
    weak_areas JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User attempts table for tracking each answer attempt
CREATE TABLE IF NOT EXISTS user_attempts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    question_id VARCHAR(255) NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'flashcard' or 'quiz'
    selected_answer INT NOT NULL,
    correct_answer INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    attempt_number INT DEFAULT 1,
    timestamp FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning reports table
CREATE TABLE IF NOT EXISTS learning_reports (
    id BIGSERIAL PRIMARY KEY,
    report_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    quiz_id VARCHAR(255) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    word_frequency JSONB NOT NULL,
    performance_stats JSONB NOT NULL,
    attempt_breakdown JSONB NOT NULL,
    key_takeaways TEXT[],
    video_type VARCHAR(100) DEFAULT 'General',
    domain VARCHAR(100) DEFAULT 'Mixed',
    main_topics TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video notes table
CREATE TABLE IF NOT EXISTS video_notes (
    id BIGSERIAL PRIMARY KEY,
    notes_id VARCHAR(255) UNIQUE NOT NULL,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sections JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log table for tracking user actions
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    video_id VARCHAR(255) REFERENCES videos(id) ON DELETE CASCADE,
    activity_desc TEXT NOT NULL,
    activity_type VARCHAR(50), -- e.g., 'flashcard_test', 'quiz_completed', 'note_edited'
    metadata JSONB DEFAULT '{}', -- Additional data like score, time spent, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_id ON videos(id);
CREATE INDEX IF NOT EXISTS idx_project_videos_project_id ON project_videos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_videos_video_id ON project_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_questions_video_id ON questions(video_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_video_id ON quizzes(video_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_video ON user_progress(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_user_id ON user_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_video_id ON user_attempts(video_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_question_id ON user_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_learning_reports_report_id ON learning_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_learning_reports_user_video ON learning_reports(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_video_notes_video_id ON video_notes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_notes_notes_id ON video_notes(notes_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_video_id ON activity_log(video_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Users: Users can read their own data, admins can read all
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Projects: Users can only access their own projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Videos: Allow viewing videos (no direct ownership)
-- Access control is managed through project_videos junction table
CREATE POLICY "Users can view videos in their projects" ON videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_videos
            JOIN projects ON projects.id = project_videos.project_id
            WHERE project_videos.video_id = videos.id
            AND projects.user_id = auth.uid()
        )
    );

-- Allow backend service to insert videos (will use service_role key)
CREATE POLICY "Allow video creation" ON videos
    FOR INSERT WITH CHECK (true);

-- Project-Videos junction table: Users can link videos to their own projects
CREATE POLICY "Users can view their project-video links" ON project_videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can link videos to their projects" ON project_videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove videos from their projects" ON project_videos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- For now, allow all operations on other tables (modify for production)
CREATE POLICY "Allow all operations on questions" ON questions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on quizzes" ON quizzes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can access own progress" ON user_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can access own quiz results" ON quiz_results
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can access own attempts" ON user_attempts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can access own reports" ON learning_reports
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow all operations on video_notes" ON video_notes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can access own activity log" ON activity_log
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, role, credit_available)
    VALUES (NEW.id, 'user', 10);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
