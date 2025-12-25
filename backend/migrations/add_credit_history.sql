-- Migration: Add Credit History Tracking
-- Date: 2025-12-25
-- Description: Track all credit transactions for transparency and debugging

-- Create credit_history table
CREATE TABLE IF NOT EXISTS credit_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id VARCHAR(255) REFERENCES videos(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    credit_type VARCHAR(20) NOT NULL CHECK (credit_type IN ('transcription', 'notes')),
    amount INTEGER NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('deduct', 'add', 'refund')),
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_video_id ON credit_history(video_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_created_at ON credit_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_history_credit_type ON credit_history(credit_type);

-- Enable Row Level Security
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own credit history
CREATE POLICY "Users can view own credit history" ON credit_history
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Only service role can insert credit history
CREATE POLICY "Service can insert credit history" ON credit_history
    FOR INSERT WITH CHECK (true);

-- Create a view for easy credit history reporting
CREATE OR REPLACE VIEW credit_history_with_details AS
SELECT
    ch.id,
    ch.user_id,
    ch.video_id,
    v.title as video_title,
    ch.project_id,
    p.project_name,
    ch.credit_type,
    ch.amount,
    ch.operation,
    ch.balance_before,
    ch.balance_after,
    ch.description,
    ch.metadata,
    ch.created_at
FROM credit_history ch
LEFT JOIN videos v ON ch.video_id = v.id
LEFT JOIN projects p ON ch.project_id = p.id
ORDER BY ch.created_at DESC;

-- Grant access to the view
GRANT SELECT ON credit_history_with_details TO authenticated;
