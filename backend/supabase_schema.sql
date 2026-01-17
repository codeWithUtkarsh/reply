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
    batch_current INTEGER DEFAULT 0, -- Current batch being processed (0 if not using batches)
    batch_total INTEGER DEFAULT 0, -- Total number of batches (0 if not using batches)
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
    quiz_id VARCHAR(255), -- ID of the quiz this attempt belongs to (for quiz question types)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning reports table
CREATE TABLE IF NOT EXISTS learning_reports (
    id BIGSERIAL PRIMARY KEY,
    report_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    quiz_id VARCHAR(255) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,

    -- Enhanced AI-powered report fields
    executive_summary JSONB DEFAULT '{}'::jsonb,  -- Overall score, status, topic counts
    key_takeaways TEXT[],                         -- AI-generated personalized insights
    weak_areas JSONB DEFAULT '{}'::jsonb,         -- Weak concepts, mastery analysis, gaps
    video_recommendations JSONB DEFAULT '[]'::jsonb,  -- YouTube search recommendations
    learning_path JSONB DEFAULT '{}'::jsonb,      -- Learning path and circuit map

    -- Performance and content analysis
    word_frequency JSONB NOT NULL,
    performance_stats JSONB NOT NULL,
    attempt_breakdown JSONB NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_user_attempts_quiz_id ON user_attempts(quiz_id);
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
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Projects: Users can only access their own projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own projects" ON projects;
CREATE POLICY "Users can create own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Videos: Allow viewing videos (no direct ownership)
-- Access control is managed through project_videos junction table
DROP POLICY IF EXISTS "Users can view videos in their projects" ON videos;
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
DROP POLICY IF EXISTS "Allow video creation" ON videos;
CREATE POLICY "Allow video creation" ON videos
    FOR INSERT WITH CHECK (true);

-- Project-Videos junction table: Users can link videos to their own projects
DROP POLICY IF EXISTS "Users can view their project-video links" ON project_videos;
CREATE POLICY "Users can view their project-video links" ON project_videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can link videos to their projects" ON project_videos;
CREATE POLICY "Users can link videos to their projects" ON project_videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can remove videos from their projects" ON project_videos;
CREATE POLICY "Users can remove videos from their projects" ON project_videos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- For now, allow all operations on other tables (modify for production)
DROP POLICY IF EXISTS "Allow all operations on questions" ON questions;
CREATE POLICY "Allow all operations on questions" ON questions
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on quizzes" ON quizzes;
CREATE POLICY "Allow all operations on quizzes" ON quizzes
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can access own progress" ON user_progress;
CREATE POLICY "Users can access own progress" ON user_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own quiz results" ON quiz_results;
CREATE POLICY "Users can access own quiz results" ON quiz_results
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own attempts" ON user_attempts;
CREATE POLICY "Users can access own attempts" ON user_attempts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own reports" ON learning_reports;
CREATE POLICY "Users can access own reports" ON learning_reports
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow all operations on video_notes" ON video_notes;
CREATE POLICY "Allow all operations on video_notes" ON video_notes
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can access own activity log" ON activity_log;
CREATE POLICY "Users can access own activity log" ON activity_log
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to automatically create user profile on signup
-- Gives new users 500 credits welcome bonus (250 video credits + 250 notes credits)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    bonus_video_credits INTEGER := 250;  -- 250 video credits from 500 total bonus
    bonus_notes_credits INTEGER := 250;  -- 250 notes credits from 500 total bonus
BEGIN
    -- Create user profile with welcome bonus
    INSERT INTO public.users (id, role, credit_available, transcription_credits, notes_credits)
    VALUES (NEW.id, 'user', 500, bonus_video_credits, bonus_notes_credits);

    -- Log video credits bonus in credit_history
    INSERT INTO public.credit_history (
        user_id,
        credit_type,
        amount,
        operation,
        balance_before,
        balance_after,
        description,
        metadata
    ) VALUES (
        NEW.id,
        'transcription',
        bonus_video_credits,
        'add',
        0,
        bonus_video_credits,
        'Welcome bonus - New user signup',
        jsonb_build_object('bonus_type', 'signup', 'bonus_value_credits', 500)
    );

    -- Log notes credits bonus in credit_history
    INSERT INTO public.credit_history (
        user_id,
        credit_type,
        amount,
        operation,
        balance_before,
        balance_after,
        description,
        metadata
    ) VALUES (
        NEW.id,
        'notes',
        bonus_notes_credits,
        'add',
        0,
        bonus_notes_credits,
        'Welcome bonus - New user signup',
        jsonb_build_object('bonus_type', 'signup', 'bonus_value_credits', 500)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- PRICING AND SUBSCRIPTION SYSTEM
-- ============================================================================

-- Add credit tracking columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS transcription_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_credits_purchased_video INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_credits_purchased_notes INTEGER DEFAULT 0;

-- Credit history table for tracking credit changes
CREATE TABLE IF NOT EXISTS credit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credit_type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    operation VARCHAR(20) NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    price_gbp DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- Stores USD despite column name
    billing_period VARCHAR(20) DEFAULT 'monthly',

    -- Credit allocations (in minutes)
    video_learning_credits INTEGER NOT NULL DEFAULT 0,
    notes_generation_credits INTEGER NOT NULL DEFAULT 0,

    -- Streak savings percentage
    streak_credit_save_percentage INTEGER DEFAULT 0,

    -- Referral program
    referral_percentage DECIMAL(5, 2) DEFAULT 0.00,
    min_withdrawal_gbp DECIMAL(10, 2) DEFAULT 0.00,  -- Stores USD despite column name

    -- Features (stored as JSONB for flexibility)
    features JSONB DEFAULT '{}',

    -- Plan metadata
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES pricing_plans(id),

    -- Subscription status
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Billing dates
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    -- Payment tracking (Polar)
    stripe_subscription_id VARCHAR(255),  -- Used for Polar checkout ID
    stripe_customer_id VARCHAR(255),

    -- Credits tracking (remaining credits for current period)
    video_learning_credits_remaining INTEGER DEFAULT 0,
    notes_generation_credits_remaining INTEGER DEFAULT 0,
    credits_reset_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Referral tracking
    referral_code VARCHAR(50),
    commission_percentage DECIMAL(5, 2) NOT NULL,
    commission_amount_gbp DECIMAL(10, 2) DEFAULT 0.00,  -- Stores USD despite column name

    -- Payment status
    payment_status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_referred_user UNIQUE (referred_user_id)
);

-- Credit packages table (Pay as You Go)
CREATE TABLE IF NOT EXISTS credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,

    -- Credits included
    video_learning_credits INTEGER NOT NULL DEFAULT 0,
    notes_generation_credits INTEGER NOT NULL DEFAULT 0,

    -- Pricing
    price_gbp DECIMAL(10, 2) NOT NULL,  -- Stores USD despite column name

    -- Marketing
    description TEXT,
    is_popular BOOLEAN DEFAULT false,
    discount_percentage INTEGER DEFAULT 0,
    badge_text VARCHAR(50),

    -- Status
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES credit_packages(id),  -- Nullable for custom purchases

    -- Purchase details
    video_learning_credits INTEGER NOT NULL,
    notes_generation_credits INTEGER NOT NULL,
    amount_gbp DECIMAL(10, 2) NOT NULL,  -- Stores USD despite column name

    -- Payment tracking
    polar_checkout_id VARCHAR(255),
    polar_transaction_id VARCHAR(255),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pricing plans (USD pricing)
INSERT INTO pricing_plans (name, display_name, price_gbp, video_learning_credits, notes_generation_credits,
                          streak_credit_save_percentage, referral_percentage, min_withdrawal_gbp, features, sort_order, description)
VALUES
    (
        'free',
        'Free',
        0.00,
        75,
        300,
        0,
        10.00,
        0.00,
        '{"sessions_estimate": "5-7 full learning sessions", "priority_processing": false, "bulk_export": false}'::jsonb,
        1,
        '75 mins video learning credits (about 5-7 full learning sessions) and 300 mins notes generation'
    ),
    (
        'student',
        'Student',
        10.00,
        180,
        900,
        20,
        15.00,
        27.00,
        '{"priority_processing": false, "bulk_export": false}'::jsonb,
        2,
        'Perfect for students - 180 mins video learning and 900 mins notes generation with streak bonuses'
    ),
    (
        'professional',
        'Professional',
        49.00,
        900,
        5000,
        50,
        15.00,
        13.00,
        '{"priority_processing": true, "bulk_export": true}'::jsonb,
        3,
        'For professionals - 900 mins video learning and 5,000 mins notes generation with premium features'
    )
ON CONFLICT (name) DO NOTHING;

-- Insert default credit packages (USD pricing)
INSERT INTO credit_packages (name, display_name, video_learning_credits, notes_generation_credits,
                            price_gbp, description, is_popular, discount_percentage, badge_text, sort_order)
VALUES
    (
        'starter',
        'Starter Pack',
        60,
        240,
        5.00,
        'Perfect for trying out the platform',
        false,
        0,
        NULL,
        1
    ),
    (
        'popular',
        'Popular Pack',
        150,
        600,
        13.00,
        'Most popular choice for casual learners',
        true,
        17,
        'Best Value',
        2
    ),
    (
        'power',
        'Power Pack',
        300,
        1200,
        24.00,
        'Great for heavy users',
        false,
        25,
        'Save 25%',
        3
    ),
    (
        'mega',
        'Mega Pack',
        600,
        2500,
        40.00,
        'Maximum value for professionals',
        false,
        38,
        'Save 38%',
        4
    )
ON CONFLICT DO NOTHING;

-- Indexes for pricing tables
CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_payment_status ON referrals(payment_status);
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON credit_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_credit_packages_sort ON credit_packages(sort_order);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_polar_checkout ON credit_purchases(polar_checkout_id);

-- Enable Row Level Security
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_history
DROP POLICY IF EXISTS "Users can view own credit history" ON credit_history;
CREATE POLICY "Users can view own credit history" ON credit_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert credit history" ON credit_history;
CREATE POLICY "System can insert credit history" ON credit_history
    FOR INSERT WITH CHECK (true);

-- RLS Policies for pricing_plans
DROP POLICY IF EXISTS "Anyone can view active pricing plans" ON pricing_plans;
CREATE POLICY "Anyone can view active pricing plans" ON pricing_plans
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage pricing plans" ON pricing_plans;
CREATE POLICY "Admins can manage pricing plans" ON pricing_plans
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage subscriptions" ON subscriptions;
CREATE POLICY "System can manage subscriptions" ON subscriptions
    FOR ALL WITH CHECK (true);

-- RLS Policies for referrals
DROP POLICY IF EXISTS "Users can view referrals they made" ON referrals;
CREATE POLICY "Users can view referrals they made" ON referrals
    FOR SELECT USING (auth.uid() = referrer_user_id);

DROP POLICY IF EXISTS "System can manage referrals" ON referrals;
CREATE POLICY "System can manage referrals" ON referrals
    FOR ALL WITH CHECK (true);

-- RLS Policies for credit_packages
DROP POLICY IF EXISTS "Anyone can view active credit packages" ON credit_packages;
CREATE POLICY "Anyone can view active credit packages" ON credit_packages
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage credit packages" ON credit_packages;
CREATE POLICY "Admins can manage credit packages" ON credit_packages
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for credit_purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON credit_purchases;
CREATE POLICY "Users can view own purchases" ON credit_purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage purchases" ON credit_purchases;
CREATE POLICY "System can manage purchases" ON credit_purchases
    FOR ALL WITH CHECK (true);

-- Function to apply credit purchases
CREATE OR REPLACE FUNCTION apply_credit_purchase()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        -- Add credits to user's account
        UPDATE users
        SET
            transcription_credits = COALESCE(transcription_credits, 0) + NEW.video_learning_credits,
            notes_credits = COALESCE(notes_credits, 0) + NEW.notes_generation_credits,
            total_credits_purchased_video = COALESCE(total_credits_purchased_video, 0) + NEW.video_learning_credits,
            total_credits_purchased_notes = COALESCE(total_credits_purchased_notes, 0) + NEW.notes_generation_credits,
            updated_at = NOW()
        WHERE id = NEW.user_id;

        -- Log video credits
        INSERT INTO credit_history (
            user_id, credit_type, amount, operation,
            balance_before, balance_after, description, metadata
        )
        SELECT
            NEW.user_id, 'transcription', NEW.video_learning_credits, 'add',
            u.transcription_credits - NEW.video_learning_credits,
            u.transcription_credits,
            'Pay as You Go credit purchase',
            jsonb_build_object('purchase_id', NEW.id, 'package_id', NEW.package_id, 'amount_paid', NEW.amount_gbp)
        FROM users u WHERE u.id = NEW.user_id;

        -- Log notes credits
        INSERT INTO credit_history (
            user_id, credit_type, amount, operation,
            balance_before, balance_after, description, metadata
        )
        SELECT
            NEW.user_id, 'notes', NEW.notes_generation_credits, 'add',
            u.notes_credits - NEW.notes_generation_credits,
            u.notes_credits,
            'Pay as You Go credit purchase',
            jsonb_build_object('purchase_id', NEW.id, 'package_id', NEW.package_id, 'amount_paid', NEW.amount_gbp)
        FROM users u WHERE u.id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-apply credits
DROP TRIGGER IF EXISTS apply_credit_purchase_trigger ON credit_purchases;
CREATE TRIGGER apply_credit_purchase_trigger
    AFTER INSERT OR UPDATE ON credit_purchases
    FOR EACH ROW
    EXECUTE FUNCTION apply_credit_purchase();
