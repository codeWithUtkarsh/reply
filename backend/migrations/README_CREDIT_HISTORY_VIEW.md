# Credit History View Migration

## Overview
This migration creates the `credit_history_with_details` database view that is required for the credits page to function properly.

## Purpose
The view joins the `credit_history` table with `videos` and `projects` tables to provide comprehensive transaction details including:
- Video titles for video-related transactions
- Project names for project-scoped transactions
- All credit transaction metadata

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
After running the migration, verify the view exists:

```sql
-- Check if the view exists
SELECT * FROM information_schema.views
WHERE table_name = 'credit_history_with_details';

-- Test the view with a sample query
SELECT * FROM credit_history_with_details LIMIT 5;
```

## What This Fixes
- **Credits Page Not Loading**: The `/credits` page requires this view to display transaction history
- **API Error**: Fixes the error: "Could not find the table 'public.credit_history_with_details' in the schema cache"

## Rollback
To rollback this migration (if needed):

```sql
DROP VIEW IF EXISTS credit_history_with_details;
```

## Related Files
- **Backend**: `backend/database.py` - `get_credit_history()` method uses this view
- **Frontend**: `frontend/app/credits/page.tsx` - Credits page that displays the data
- **API Route**: `backend/routes/users.py` - `/api/users/{user_id}/credit-history` endpoint

## Notes
- The view includes LEFT JOINs, so transactions without associated videos or projects will still appear
- The view is ordered by `created_at DESC` to show most recent transactions first
- Access is granted to both `authenticated` and `service_role` roles
