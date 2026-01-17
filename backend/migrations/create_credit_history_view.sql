-- Migration: Create Credit History View with Details
-- Date: 2026-01-17
-- Description: Creates a view that joins credit_history with videos and projects tables
--              to provide detailed transaction information for the credits page

-- Drop the view if it exists (for re-running the migration)
DROP VIEW IF EXISTS credit_history_with_details;

-- Create the view for easy credit history reporting
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
