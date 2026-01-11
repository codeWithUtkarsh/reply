-- Migration: Add $10 signup bonus for new users
-- Description: Updates the handle_new_user function to automatically give new users
--              85 video credits + 340 notes credits (worth $10) upon signup
-- Safe to run: Yes, uses CREATE OR REPLACE FUNCTION

-- Update the user signup function to include welcome bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    bonus_video_credits INTEGER := 85;  -- Approx $10 worth based on $7 = 60 credits
    bonus_notes_credits INTEGER := 340; -- Approx $10 worth based on $7 = 240 credits
BEGIN
    -- Create user profile with welcome bonus
    INSERT INTO public.users (id, role, credit_available, transcription_credits, notes_credits)
    VALUES (NEW.id, 'user', 10, bonus_video_credits, bonus_notes_credits);

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
        jsonb_build_object('bonus_type', 'signup', 'bonus_value_usd', 10)
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
        jsonb_build_object('bonus_type', 'signup', 'bonus_value_usd', 10)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Signup bonus migration completed. New users will now receive $10 worth of credits (85 video + 340 notes).' as message;
