-- Cleanup Script: DROP ALL TABLES for complete fresh start
-- WARNING: This will delete ALL data in the database
-- Run this BEFORE running supabase_schema.sql for a fresh start

-- Drop all triggers first
DROP TRIGGER IF EXISTS apply_credit_purchase_trigger ON credit_purchases;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all functions
DROP FUNCTION IF EXISTS apply_credit_purchase();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop ALL tables (in correct order to respect foreign keys)
-- Application tables
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS learning_reports CASCADE;
DROP TABLE IF EXISTS video_notes CASCADE;
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS user_attempts CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS project_videos CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS videos CASCADE;

-- Pricing tables
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS credit_purchases CASCADE;
DROP TABLE IF EXISTS credit_packages CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS pricing_plans CASCADE;
DROP TABLE IF EXISTS credit_history CASCADE;

-- Users table (this will drop everything)
DROP TABLE IF EXISTS users CASCADE;

-- Drop all indexes (in case they weren't cascade deleted)
-- Application indexes
DROP INDEX IF EXISTS idx_users_id;
DROP INDEX IF EXISTS idx_projects_user_id;
DROP INDEX IF EXISTS idx_videos_id;
DROP INDEX IF EXISTS idx_project_videos_project_id;
DROP INDEX IF EXISTS idx_project_videos_video_id;
DROP INDEX IF EXISTS idx_questions_video_id;
DROP INDEX IF EXISTS idx_quizzes_video_id;
DROP INDEX IF EXISTS idx_user_progress_user_video;
DROP INDEX IF EXISTS idx_quiz_results_quiz_id;
DROP INDEX IF EXISTS idx_quiz_results_user_id;
DROP INDEX IF EXISTS idx_user_attempts_user_id;
DROP INDEX IF EXISTS idx_user_attempts_video_id;
DROP INDEX IF EXISTS idx_user_attempts_question_id;
DROP INDEX IF EXISTS idx_user_attempts_quiz_id;
DROP INDEX IF EXISTS idx_learning_reports_report_id;
DROP INDEX IF EXISTS idx_learning_reports_user_video;
DROP INDEX IF EXISTS idx_video_notes_video_id;
DROP INDEX IF EXISTS idx_video_notes_notes_id;
DROP INDEX IF EXISTS idx_activity_log_user_id;
DROP INDEX IF EXISTS idx_activity_log_project_id;
DROP INDEX IF EXISTS idx_activity_log_video_id;

-- Pricing indexes
DROP INDEX IF EXISTS idx_credit_history_user_id;
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

-- Success message (will show in SQL editor output)
SELECT 'Complete database cleanup finished. ALL tables have been dropped. You can now run supabase_schema.sql for a fresh database.' as message;
