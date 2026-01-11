-- Migration: Add Pricing Plans and Subscriptions
-- Description: Creates pricing plans table with Free, Student, and Professional tiers
-- and subscriptions table to track user subscriptions

-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    price_gbp DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    billing_period VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly, lifetime

    -- Credit allocations (in minutes)
    video_learning_credits INTEGER NOT NULL DEFAULT 0,
    notes_generation_credits INTEGER NOT NULL DEFAULT 0,

    -- Streak savings percentage
    streak_credit_save_percentage INTEGER DEFAULT 0,

    -- Referral program
    referral_percentage DECIMAL(5, 2) DEFAULT 0.00,
    min_withdrawal_gbp DECIMAL(10, 2) DEFAULT 0.00,

    -- Features (stored as JSONB for flexibility)
    features JSONB DEFAULT '{}',

    -- Plan metadata
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES pricing_plans(id),

    -- Subscription status
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, cancelled, expired, past_due

    -- Billing dates
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    -- Payment tracking
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),

    -- Credits tracking (remaining credits for current period)
    video_learning_credits_remaining INTEGER DEFAULT 0,
    notes_generation_credits_remaining INTEGER DEFAULT 0,
    credits_reset_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_active_user_subscription UNIQUE (user_id, status)
);

-- Create referrals table for tracking referral program
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Referral tracking
    referral_code VARCHAR(50),
    commission_percentage DECIMAL(5, 2) NOT NULL,
    commission_amount_gbp DECIMAL(10, 2) DEFAULT 0.00,

    -- Payment status
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, withdrawn
    paid_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure a user can only be referred once
    CONSTRAINT unique_referred_user UNIQUE (referred_user_id)
);

-- Insert default pricing plans
INSERT INTO pricing_plans (name, display_name, price_gbp, video_learning_credits, notes_generation_credits,
                          streak_credit_save_percentage, referral_percentage, min_withdrawal_gbp, features, sort_order, description)
VALUES
    (
        'free',
        'Free',
        0.00,
        75,  -- 75 mins video learning credits
        300, -- 300 mins notes generation
        0,   -- No streak savings
        10.00, -- 10% referral commission
        0.00,
        '{"sessions_estimate": "5-7 full learning sessions", "priority_processing": false, "bulk_export": false}'::jsonb,
        1,
        '75 mins video learning credits (about 5-7 full learning sessions) and 300 mins notes generation'
    ),
    (
        'student',
        'Student',
        12.00,
        180,  -- 180 mins video learning credits
        900,  -- 900 mins notes generation
        20,   -- Save 20% of credits for maintaining streak
        15.00, -- 15% referral commission
        27.00, -- Min withdrawal $27
        '{"priority_processing": false, "bulk_export": false}'::jsonb,
        2,
        'Perfect for students - 180 mins video learning and 900 mins notes generation with streak bonuses'
    ),
    (
        'professional',
        'Professional',
        79.00,
        900,   -- 900 mins video learning credits
        5000,  -- 5000 mins notes generation
        50,    -- Save 50% of credits for maintaining streak
        15.00, -- 15% referral commission
        13.00, -- Min withdrawal $13
        '{"priority_processing": true, "bulk_export": true}'::jsonb,
        3,
        'For professionals - 900 mins video learning and 5,000 mins notes generation with premium features'
    );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_payment_status ON referrals(payment_status);

-- Enable Row Level Security (RLS)
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pricing_plans (public read)
CREATE POLICY "Anyone can view active pricing plans"
    ON pricing_plans FOR SELECT
    USING (is_active = true);

CREATE POLICY "Only admins can modify pricing plans"
    ON pricing_plans FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert subscriptions"
    ON subscriptions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update subscriptions"
    ON subscriptions FOR UPDATE
    USING (true);

-- RLS Policies for referrals
CREATE POLICY "Users can view their referrals as referrer"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_user_id);

CREATE POLICY "Admins can view all referrals"
    ON referrals FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert referrals"
    ON referrals FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update referrals"
    ON referrals FOR UPDATE
    USING (true);

-- Create function to automatically assign free plan to new users
CREATE OR REPLACE FUNCTION assign_free_plan_to_new_user()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
    free_plan_record RECORD;
BEGIN
    -- Get the free plan
    SELECT id, video_learning_credits, notes_generation_credits
    INTO free_plan_record
    FROM pricing_plans
    WHERE name = 'free' AND is_active = true
    LIMIT 1;

    IF free_plan_record.id IS NOT NULL THEN
        -- Create subscription for new user
        INSERT INTO subscriptions (
            user_id,
            plan_id,
            status,
            current_period_end,
            video_learning_credits_remaining,
            notes_generation_credits_remaining,
            credits_reset_at
        )
        VALUES (
            NEW.id,
            free_plan_record.id,
            'active',
            NOW() + INTERVAL '30 days',
            free_plan_record.video_learning_credits,
            free_plan_record.notes_generation_credits,
            NOW() + INTERVAL '30 days'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to assign free plan to new users
DROP TRIGGER IF EXISTS assign_free_plan_trigger ON users;
CREATE TRIGGER assign_free_plan_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_free_plan_to_new_user();

-- Create function to reset credits on subscription renewal
CREATE OR REPLACE FUNCTION reset_subscription_credits()
RETURNS void AS $$
DECLARE
    subscription_record RECORD;
    plan_record RECORD;
BEGIN
    FOR subscription_record IN
        SELECT * FROM subscriptions
        WHERE status = 'active'
        AND credits_reset_at <= NOW()
    LOOP
        -- Get plan details
        SELECT * INTO plan_record
        FROM pricing_plans
        WHERE id = subscription_record.plan_id;

        IF plan_record.id IS NOT NULL THEN
            -- Reset credits
            UPDATE subscriptions
            SET
                video_learning_credits_remaining = plan_record.video_learning_credits,
                notes_generation_credits_remaining = plan_record.notes_generation_credits,
                credits_reset_at = CASE
                    WHEN plan_record.billing_period = 'monthly' THEN NOW() + INTERVAL '30 days'
                    WHEN plan_record.billing_period = 'yearly' THEN NOW() + INTERVAL '365 days'
                    ELSE credits_reset_at
                END,
                current_period_start = NOW(),
                current_period_end = CASE
                    WHEN plan_record.billing_period = 'monthly' THEN NOW() + INTERVAL '30 days'
                    WHEN plan_record.billing_period = 'yearly' THEN NOW() + INTERVAL '365 days'
                    ELSE current_period_end
                END,
                updated_at = NOW()
            WHERE id = subscription_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update users table to link to current subscription
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_subscription_id UUID REFERENCES subscriptions(id);
CREATE INDEX IF NOT EXISTS idx_users_current_subscription_id ON users(current_subscription_id);

-- Create function to update user's current subscription
CREATE OR REPLACE FUNCTION update_user_current_subscription()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' THEN
        UPDATE users
        SET current_subscription_id = NEW.id
        WHERE id = NEW.user_id;
    ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
        UPDATE users
        SET current_subscription_id = NULL
        WHERE id = NEW.user_id AND current_subscription_id = OLD.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update user's current subscription
DROP TRIGGER IF EXISTS update_user_subscription_trigger ON subscriptions;
CREATE TRIGGER update_user_subscription_trigger
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_current_subscription();
