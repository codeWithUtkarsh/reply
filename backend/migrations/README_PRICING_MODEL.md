# Pricing Model Migration Guide

This guide explains how to set up and migrate the pricing model for PrepLM.

## Migration Files

### 1. `cleanup_database.sql`
**Purpose:** Complete database reset - drops ALL tables
**When to use:** When you want a fresh start
**Warning:** ⚠️ This will DELETE ALL DATA in the database

```sql
-- Run in Supabase SQL Editor
\i backend/migrations/cleanup_database.sql
```

### 2. `add_signup_bonus.sql`
**Purpose:** Add $10 signup bonus for new users
**When to use:** To enable the welcome bonus feature on an existing database
**Safe to run:** ✅ Yes, can be run multiple times (uses CREATE OR REPLACE)

```sql
-- Run in Supabase SQL Editor
\i backend/migrations/add_signup_bonus.sql
```

## Setup Scenarios

### Scenario A: Fresh Database Setup
If you want to start completely fresh:

```sql
-- Step 1: Clean everything (⚠️ DELETES ALL DATA)
\i backend/migrations/cleanup_database.sql

-- Step 2: Create all tables and pricing structure
\i backend/supabase_schema.sql
```

This will give you:
- All tables created fresh
- Free, Student, and Professional plans (USD pricing)
- Credit packages: Starter ($7), Popular ($13), Power ($24), Mega ($40)
- $10 signup bonus automatically configured
- All RLS policies properly set

### Scenario B: Update Existing Database
If you have an existing database and just want to add the signup bonus:

```sql
-- Run this single migration
\i backend/migrations/add_signup_bonus.sql
```

This will:
- Update the `handle_new_user()` function
- New users will get 85 video credits + 340 notes credits (worth $10)
- Credit history will be logged automatically

### Scenario C: Update Pricing on Existing Database
If you need to update just the pricing structure:

```sql
-- Run the full schema (it's idempotent)
\i backend/supabase_schema.sql
```

The schema uses:
- `CREATE TABLE IF NOT EXISTS` - won't drop existing tables
- `DROP POLICY IF EXISTS` - safely updates policies
- `ON CONFLICT DO NOTHING` - won't duplicate pricing data
- `CREATE OR REPLACE FUNCTION` - updates functions safely

## Features Included

### New User Signup Bonus
- **Amount:** $10 worth of credits
- **Video Credits:** 85 minutes
- **Notes Credits:** 340 minutes
- **Tracking:** Automatically logged in `credit_history` table
- **Frontend:** Welcome banner shown to new users for 24 hours

### Pricing Plans (USD)
1. **Free Plan** - $0/month
   - 75 mins video learning
   - 300 mins notes generation

2. **Student Plan** - $12/month
   - 180 mins video learning
   - 900 mins notes generation
   - 20% streak savings

3. **Professional Plan** - $79/month
   - 900 mins video learning
   - 5,000 mins notes generation
   - 50% streak savings
   - Priority processing

### Pay as You Go Packages (USD)
1. **Starter Pack** - $7
   - 60 mins video + 240 mins notes

2. **Popular Pack** - $13
   - 150 mins video + 600 mins notes
   - 17% discount

3. **Power Pack** - $24
   - 300 mins video + 1,200 mins notes
   - 25% discount

4. **Mega Pack** - $40
   - 600 mins video + 2,500 mins notes
   - 38% discount

## Verification

After running migrations, verify the setup:

```sql
-- Check if signup bonus function exists
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- Check pricing plans
SELECT name, display_name, price_gbp, video_learning_credits, notes_generation_credits
FROM pricing_plans
ORDER BY sort_order;

-- Check credit packages
SELECT name, display_name, price_gbp, video_learning_credits, notes_generation_credits
FROM credit_packages
ORDER BY sort_order;
```

## Troubleshooting

### Error: "policy already exists"
**Solution:** The schema now includes `DROP POLICY IF EXISTS`, so this shouldn't happen. If it does, run the full schema which will update the policies.

### Error: "function handle_new_user() does not exist"
**Solution:** Run either the full schema or the `add_signup_bonus.sql` migration.

### New users not getting bonus
**Checklist:**
1. Verify the function exists (see Verification section)
2. Check if the trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
3. Verify `credit_history` table exists
4. Check Supabase logs for any trigger errors

## Notes

- All pricing is stored in `price_gbp` column but values are in USD
- Credit amounts are in minutes
- The signup bonus is automatically applied via database trigger
- Frontend will show welcome banner for accounts created within 24 hours
