-- Supabase Database Schema for Preply Video Learning App

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id BIGSERIAL PRIMARY KEY,
    video_id VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    duration FLOAT NOT NULL,
    transcript JSONB NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
    question_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (video_id) REFERENCES videos(video_id)
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id BIGSERIAL PRIMARY KEY,
    quiz_id VARCHAR(255) UNIQUE NOT NULL,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
    questions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
    progress_data JSONB NOT NULL,
    last_timestamp FLOAT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Quiz results table
CREATE TABLE IF NOT EXISTS quiz_results (
    id BIGSERIAL PRIMARY KEY,
    quiz_id VARCHAR(255) NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    score_percentage FLOAT NOT NULL,
    correct_answers INT NOT NULL,
    total_questions INT NOT NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id);
CREATE INDEX IF NOT EXISTS idx_questions_video_id ON questions(video_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_video_id ON quizzes(video_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_video ON user_progress(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id);

-- Enable Row Level Security (RLS)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Policies (adjust based on your authentication needs)
-- For now, allow all operations (modify for production)

CREATE POLICY "Allow all operations on videos" ON videos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on questions" ON questions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on quizzes" ON quizzes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on user_progress" ON user_progress
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on quiz_results" ON quiz_results
    FOR ALL USING (true) WITH CHECK (true);
