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

-- Note: This script assumes your 'users' and 'credit_history' tables should be preserved
-- If you need to drop those as well, uncomment the lines below:
-- DROP TABLE IF EXISTS credit_history CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Success message (will show in SQL editor output)
SELECT 'Database cleanup completed successfully. You can now run supabase_schema.sql' as message;
