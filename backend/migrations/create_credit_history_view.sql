-- Migration: Create Credit History View with Details
-- Date: 2026-01-17
-- Description: Adds missing columns to credit_history table and creates a view that
--              joins credit_history with videos and projects tables to provide
--              detailed transaction information for the credits page

-- Step 1: Add missing columns to credit_history table if they don't exist
-- Check and add video_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'credit_history' AND column_name = 'video_id'
    ) THEN
        ALTER TABLE credit_history
        ADD COLUMN video_id VARCHAR(255) REFERENCES videos(id) ON DELETE SET NULL;

        -- Create index for video_id
        CREATE INDEX IF NOT EXISTS idx_credit_history_video_id ON credit_history(video_id);
    END IF;
END $$;

-- Check and add project_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'credit_history' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE credit_history
        ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

        -- Create index for project_id
        CREATE INDEX IF NOT EXISTS idx_credit_history_project_id ON credit_history(project_id);
    END IF;
END $$;

-- Step 2: Drop the view if it exists (for re-running the migration)
DROP VIEW IF EXISTS credit_history_with_details;

-- Step 3: Create the view for easy credit history reporting
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

-- Grant access to the view for authenticated users
GRANT SELECT ON credit_history_with_details TO authenticated;

-- Grant access to the view for service role
GRANT SELECT ON credit_history_with_details TO service_role;

-- Add comment to the view for documentation
COMMENT ON VIEW credit_history_with_details IS
'Provides a detailed view of credit transaction history with related video and project information. Used by the credits page to display transaction details to users.';
