# Database Migration: Enhanced Reports

## What This Migration Does

Adds support for AI-powered enhanced learning reports with:
- **Executive Summary**: Overall score, status, topic counts
- **Weak Areas**: AI-identified concepts, mastery levels, knowledge gaps
- **Video Recommendations**: YouTube search queries for each weak area
- **Learning Path**: Step-by-step roadmap and circuit map visualization

## How to Apply This Migration

### Option 1: Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `add_enhanced_report_fields.sql`
4. Click **Run**

### Option 2: Command Line

If you have direct database access:

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f backend/migrations/add_enhanced_report_fields.sql
```

## Verification

After running the migration, verify the columns were added:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'learning_reports'
ORDER BY ordinal_position;
```

You should see the new columns:
- `executive_summary` (jsonb)
- `weak_areas` (jsonb)
- `video_recommendations` (jsonb)
- `learning_path` (jsonb)

## Rollback (if needed)

If you need to remove these columns:

```sql
ALTER TABLE learning_reports
DROP COLUMN IF EXISTS executive_summary,
DROP COLUMN IF EXISTS weak_areas,
DROP COLUMN IF EXISTS video_recommendations,
DROP COLUMN IF EXISTS learning_path;
```

## Impact

- **Existing data**: Not affected - new columns have default values
- **Existing reports**: Will continue to work - old reports won't have new fields
- **New reports**: Will include all enhanced AI features

## Testing

After applying the migration, test report generation:

1. Complete a quiz in the frontend
2. Generate a learning report
3. Verify the report displays:
   - Executive summary banner
   - Key takeaways
   - Weak areas with severity
   - Video recommendations
   - Mastery progress bars
   - Learning path circuit map
