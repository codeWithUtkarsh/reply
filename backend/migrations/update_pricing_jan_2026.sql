-- Migration: Update Pricing Tiers - January 2026
-- Description: Updates pricing plans and credit packages to new pricing structure
--              - Student: $12 → $10
--              - Professional: $79 → $49
--              - Flex Starter: $7 → $5
--              - Signup bonus: $10 (85+340) → 500 credits (250+250)
-- Safe to run: Yes, uses UPDATE statements

-- Update Student plan pricing
UPDATE pricing_plans
SET price_gbp = 10.00,
    updated_at = NOW()
WHERE name = 'student';

-- Update Professional plan pricing
UPDATE pricing_plans
SET price_gbp = 49.00,
    updated_at = NOW()
WHERE name = 'professional';

-- Update Flex Starter Pack pricing
UPDATE credit_packages
SET price_gbp = 5.00,
    updated_at = NOW()
WHERE name = 'starter';

-- Update the signup bonus function to give 500 credits (250+250)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    bonus_video_credits INTEGER := 250;  -- 250 video credits from 500 total bonus
    bonus_notes_credits INTEGER := 250;  -- 250 notes credits from 500 total bonus
BEGIN
    -- Create user profile with welcome bonus
    INSERT INTO public.users (id, role, credit_available, transcription_credits, notes_credits)
    VALUES (NEW.id, 'user', 500, bonus_video_credits, bonus_notes_credits);

    -- Log video credits bonus in credit_history
    INSERT INTO public.credit_history (
        user_id,
        credit_type,
        amount,
        operation,
        balance_before,
        balance_after,
        description,
        metadata
    ) VALUES (
        NEW.id,
        'transcription',
        bonus_video_credits,
        'add',
        0,
        bonus_video_credits,
        'Welcome bonus - New user signup',
        jsonb_build_object('bonus_type', 'signup', 'bonus_value_credits', 500)
    );

    -- Log notes credits bonus in credit_history
    INSERT INTO public.credit_history (
        user_id,
        credit_type,
        amount,
        operation,
        balance_before,
        balance_after,
        description,
        metadata
    ) VALUES (
        NEW.id,
        'notes',
        bonus_notes_credits,
        'add',
        0,
        bonus_notes_credits,
        'Welcome bonus - New user signup',
        jsonb_build_object('bonus_type', 'signup', 'bonus_value_credits', 500)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT
    'Pricing migration completed successfully!' as message,
    (SELECT price_gbp FROM pricing_plans WHERE name = 'student') as student_price,
    (SELECT price_gbp FROM pricing_plans WHERE name = 'professional') as professional_price,
    (SELECT price_gbp FROM credit_packages WHERE name = 'starter') as flex_starter_price;
