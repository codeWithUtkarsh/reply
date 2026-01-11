-- Cleanup Script: Remove all pricing-related tables and dependencies
-- Run this BEFORE running supabase_schema.sql for a fresh start

-- Drop all triggers first
DROP TRIGGER IF EXISTS apply_credit_purchase_trigger ON credit_purchases;

-- Drop all functions
DROP FUNCTION IF EXISTS apply_credit_purchase();

-- Drop all tables (in correct order to respect foreign keys)
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS credit_purchases CASCADE;
DROP TABLE IF EXISTS credit_packages CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS pricing_plans CASCADE;
DROP TABLE IF EXISTS credit_history CASCADE;

-- Drop any remaining indexes (in case they weren't cascade deleted)
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_plan_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_stripe_subscription_id;
DROP INDEX IF EXISTS idx_referrals_referrer_user_id;
DROP INDEX IF EXISTS idx_referrals_referred_user_id;
DROP INDEX IF EXISTS idx_referrals_payment_status;
DROP INDEX IF EXISTS idx_credit_packages_active;
DROP INDEX IF EXISTS idx_credit_packages_sort;
DROP INDEX IF EXISTS idx_credit_purchases_user_id;
DROP INDEX IF EXISTS idx_credit_purchases_status;
DROP INDEX IF EXISTS idx_credit_purchases_polar_checkout;
DROP INDEX IF EXISTS idx_credit_history_user_id;

-- Reset credit columns in users table (if they exist)
-- This will set all credit-related columns to 0 for existing users
DO $$
BEGIN
    -- Reset credit tracking columns to 0
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'transcription_credits') THEN
        UPDATE users SET transcription_credits = 0;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notes_credits') THEN
        UPDATE users SET notes_credits = 0;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_credits_purchased_video') THEN
        UPDATE users SET total_credits_purchased_video = 0;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_credits_purchased_notes') THEN
        UPDATE users SET total_credits_purchased_notes = 0;
    END IF;
END $$;

-- Success message (will show in SQL editor output)
SELECT 'Database cleanup completed successfully. All credit data has been reset. You can now run supabase_schema.sql' as message;
