# Credit History View Migration

## Overview
This migration adds missing columns to the `credit_history` table and creates the `credit_history_with_details` database view that is required for the credits page to function properly.

## What This Migration Does
1. **Adds missing columns to credit_history table**:
   - `video_id` (VARCHAR(255)) - References videos table
   - `project_id` (UUID) - References projects table
   - Creates indexes for both columns for better query performance

2. **Creates the database view**:
   - Joins `credit_history` with `videos` and `projects` tables
   - Provides comprehensive transaction details including video titles and project names

## Purpose
The migration enables tracking which videos and projects are associated with each credit transaction, and provides an easy-to-query view for displaying:
- Video titles for video-related transactions
- Project names for project-scoped transactions
- All credit transaction metadata in one place

## Migration File
- **File**: `create_credit_history_view.sql`
- **Date**: 2026-01-17
- **Dependencies**: Requires `credit_history`, `videos`, and `projects` tables to exist

## How to Run the Migration

### Option 1: Using Supabase SQL Editor (Recommended)
1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `create_credit_history_view.sql`
4. Paste and run the SQL in the editor
5. Verify the view was created successfully

### Option 2: Using psql Command Line
```bash
# From the backend/migrations directory
psql -h <your-db-host> -U <your-db-user> -d <your-db-name> -f create_credit_history_view.sql
```

### Option 3: Using Supabase CLI
```bash
# From the backend/migrations directory
supabase db execute -f create_credit_history_view.sql
```

## Verification
After running the migration, verify everything was created successfully:

```sql
-- 1. Check if the new columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'credit_history'
  AND column_name IN ('video_id', 'project_id');

-- 2. Check if the view exists
SELECT * FROM information_schema.views
WHERE table_name = 'credit_history_with_details';

-- 3. Test the view with a sample query
SELECT * FROM credit_history_with_details LIMIT 5;

-- 4. Check indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'credit_history'
  AND indexname LIKE '%video_id%' OR indexname LIKE '%project_id%';
```

## What This Fixes
- **Credits Page Not Loading**: The `/credits` page requires this view to display transaction history
- **API Error**: Fixes the error: "Could not find the table 'public.credit_history_with_details' in the schema cache"

## Rollback
To rollback this migration (if needed):

```sql
-- Drop the view first
DROP VIEW IF EXISTS credit_history_with_details;

-- Optionally drop the columns (WARNING: This will delete all video_id and project_id data)
-- Only do this if you're sure you want to remove these columns
ALTER TABLE credit_history DROP COLUMN IF EXISTS video_id;
ALTER TABLE credit_history DROP COLUMN IF EXISTS project_id;
```

**Note**: Rolling back the column additions will delete all video and project associations from existing credit history records. Only do this if absolutely necessary.

## Related Files
- **Backend**: `backend/database.py` - `get_credit_history()` method uses this view
- **Frontend**: `frontend/app/credits/page.tsx` - Credits page that displays the data
- **API Route**: `backend/routes/users.py` - `/api/users/{user_id}/credit-history` endpoint

## Notes
- The migration is **idempotent** - it checks if columns exist before adding them, so it's safe to run multiple times
- The view includes LEFT JOINs, so transactions without associated videos or projects will still appear
- The view is ordered by `created_at DESC` to show most recent transactions first
- Access is granted to both `authenticated` and `service_role` roles
- **Existing credit_history records**: Any existing records will have `NULL` values for `video_id` and `project_id` after the migration. New transactions will populate these fields correctly.
- The application code in `database.py` already attempts to insert these columns, so this migration aligns the database schema with the application code
