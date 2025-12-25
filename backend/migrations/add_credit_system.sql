-- Migration: Add Credit System
-- Date: 2025-12-25
-- Description: Add separate transcription and notes credits, and DEVELOPER role

-- Step 1: Add DEVELOPER role to the role enum
-- Note: PostgreSQL doesn't support ALTER TYPE for enums in a simple way
-- We'll handle this by recreating the constraint

-- Drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with 'developer' role
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'user', 'supervisor', 'developer'));

-- Step 2: Add new credit columns
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS transcription_credits INTEGER DEFAULT 50,
    ADD COLUMN IF NOT EXISTS notes_credits INTEGER DEFAULT 50;

-- Step 3: Migrate existing credit_available to transcription_credits
-- For existing users, split their credits equally between transcription and notes
UPDATE users
SET
    transcription_credits = CASE
        WHEN credit_available > 0 THEN GREATEST(credit_available / 2, 1)
        ELSE 50
    END,
    notes_credits = CASE
        WHEN credit_available > 0 THEN GREATEST(credit_available / 2, 1)
        ELSE 50
    END
WHERE transcription_credits IS NULL OR notes_credits IS NULL;

-- Step 4: Update the trigger function to give new users 50+50 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, role, transcription_credits, notes_credits, credit_available)
    VALUES (NEW.id, 'user', 50, 50, 100);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Add index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Note: credit_available is kept for backwards compatibility but should be considered deprecated
-- New implementations should use transcription_credits and notes_credits
