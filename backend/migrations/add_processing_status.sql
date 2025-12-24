-- Migration: Add processing_status and error_message columns to videos table
-- Run this on your Supabase database

-- Add processing_status column
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'completed';

-- Add error_message column
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Make transcript nullable (for videos being processed)
ALTER TABLE videos
ALTER COLUMN transcript DROP NOT NULL;

-- Update existing videos to have 'completed' status
UPDATE videos
SET processing_status = 'completed'
WHERE processing_status IS NULL OR processing_status = '';

-- Set default for new videos to 'processing'
ALTER TABLE videos
ALTER COLUMN processing_status SET DEFAULT 'processing';
