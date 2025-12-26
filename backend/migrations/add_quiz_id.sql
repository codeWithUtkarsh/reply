-- Add quiz_id column to user_attempts
ALTER TABLE user_attempts
ADD COLUMN IF NOT EXISTS quiz_id VARCHAR(255);

-- Add index for quiz_id lookups
CREATE INDEX IF NOT EXISTS idx_user_attempts_quiz_id ON user_attempts(quiz_id);

-- Add comment
COMMENT ON COLUMN user_attempts.quiz_id IS 'ID of the quiz this attempt belongs to (for quiz question types)';
