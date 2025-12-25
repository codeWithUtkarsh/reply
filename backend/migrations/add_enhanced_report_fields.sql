-- Migration: Add enhanced report fields for AI-powered analysis
-- Description: Adds fields for executive summary, weak areas, video recommendations, and learning paths

-- Add new JSONB columns to learning_reports table
ALTER TABLE learning_reports
ADD COLUMN IF NOT EXISTS executive_summary JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS weak_areas JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS video_recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS learning_path JSONB DEFAULT '{}'::jsonb;

-- Add comment to document the new fields
COMMENT ON COLUMN learning_reports.executive_summary IS 'Overall score, status, and topic counts';
COMMENT ON COLUMN learning_reports.weak_areas IS 'Weak concepts, mastery analysis, knowledge gaps, and recommendations';
COMMENT ON COLUMN learning_reports.video_recommendations IS 'YouTube video search recommendations for weak areas';
COMMENT ON COLUMN learning_reports.learning_path IS 'Learning path, next steps, and circuit map data';
