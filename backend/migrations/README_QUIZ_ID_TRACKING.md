# Database Migration: Quiz ID Tracking for Adaptive Learning

## What This Migration Does

Adds `quiz_id` column to the `user_attempts` table to enable:
- **Accurate quiz score calculation**: Calculate average quiz scores across retakes
- **Adaptive quiz generation**: Identify weak areas from specific quiz sessions
- **Better performance tracking**: Distinguish between different quiz attempts

## Why This Is Important

Previously, we couldn't tell which attempts belonged to which quiz session. This meant:
- Quiz scores were calculated incorrectly (overall accuracy vs. average per-quiz)
- Adaptive quiz generation couldn't identify which quiz the user struggled with
- Users taking retakes would have their scores mixed together

Now with `quiz_id` tracking:
- Each quiz attempt is linked to its quiz session
- We can calculate: `Individual Quiz Score = Correct / Total per quiz`
- Average quiz score = Average of all individual quiz scores
- Adaptive quizzes can target weak areas from specific quiz attempts

## How to Apply This Migration

### Option 1: Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `add_quiz_id_to_attempts.sql`
4. Click **Run**

### Option 2: Command Line

If you have direct database access:

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f backend/migrations/add_quiz_id_to_attempts.sql
```

## Migration File Contents

```sql
-- Add quiz_id column to user_attempts
ALTER TABLE user_attempts
ADD COLUMN IF NOT EXISTS quiz_id VARCHAR(255);

-- Add index for quiz_id lookups
CREATE INDEX IF NOT EXISTS idx_user_attempts_quiz_id ON user_attempts(quiz_id);

-- Add comment
COMMENT ON COLUMN user_attempts.quiz_id IS 'ID of the quiz this attempt belongs to (for quiz question types)';
```

## Verification

After running the migration, verify the column was added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_attempts' AND column_name = 'quiz_id';
```

You should see:
- column_name: `quiz_id`
- data_type: `character varying`
- is_nullable: `YES`

Check the index was created:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_attempts' AND indexname = 'idx_user_attempts_quiz_id';
```

## Impact

- **Existing data**: Not affected - `quiz_id` will be NULL for old attempts
- **New quiz attempts**: Will have `quiz_id` populated automatically
- **Flashcard attempts**: `quiz_id` will remain NULL (only used for quiz questions)
- **Score calculation**: Will only calculate average for quiz attempts with quiz_id

## Related Code Changes

This migration supports the following code changes:

1. **Backend**:
   - `backend/database.py`: `store_attempt()` now accepts `quiz_id` parameter
   - `backend/routes/reports.py`: `record_attempt()` passes `quiz_id` to database
   - `backend/services/report_generator.py`: `_calculate_quiz_average_score()` groups by quiz_id

2. **Frontend**:
   - `frontend/lib/api.ts`: `recordAttempt()` accepts optional `quizId` parameter
   - `frontend/app/learn/[videoId]/page.tsx`: Passes `quiz_id` when recording quiz attempts

## Testing

After applying the migration:

1. **Test New Quiz Attempts**:
   - Take a quiz in the frontend
   - Check that attempts have `quiz_id` populated:
     ```sql
     SELECT question_id, quiz_id, is_correct
     FROM user_attempts
     WHERE quiz_id IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 20;
     ```

2. **Test Score Calculation**:
   - Take a quiz with 10 questions, get 7 correct (70%)
   - Retake the same quiz, get 9 correct (90%)
   - Generate learning report
   - Verify report shows average score: (70 + 90) / 2 = 80%

3. **Test Adaptive Quiz Generation**:
   - Take a quiz and answer some questions incorrectly
   - Generate a new quiz for the same video
   - Verify adaptive quiz targets your weak areas

## Rollback (if needed)

If you need to remove this column:

```sql
-- Remove index
DROP INDEX IF EXISTS idx_user_attempts_quiz_id;

-- Remove column
ALTER TABLE user_attempts DROP COLUMN IF EXISTS quiz_id;
```

**Warning**: This will delete all quiz_id data permanently!
