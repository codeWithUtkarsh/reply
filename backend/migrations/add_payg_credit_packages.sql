-- Migration: Add Pay as You Go Credit Packages
-- Description: Adds credit packages for one-time purchases and transaction tracking

-- Create credit_packages table for Pay as You Go options
CREATE TABLE IF NOT EXISTS credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,

    -- Credits included
    video_learning_credits INTEGER NOT NULL DEFAULT 0,
    notes_generation_credits INTEGER NOT NULL DEFAULT 0,

    -- Pricing
    price_gbp DECIMAL(10, 2) NOT NULL,

    -- Marketing
    description TEXT,
    is_popular BOOLEAN DEFAULT false,
    discount_percentage INTEGER DEFAULT 0,
    badge_text VARCHAR(50),

    -- Status
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_purchases table to track one-time purchases
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES credit_packages(id),  -- Nullable for custom amount purchases

    -- Purchase details
    video_learning_credits INTEGER NOT NULL,
    notes_generation_credits INTEGER NOT NULL,
    amount_gbp DECIMAL(10, 2) NOT NULL,

    -- Payment tracking
    polar_checkout_id VARCHAR(255),
    polar_transaction_id VARCHAR(255),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default credit packages
INSERT INTO credit_packages (name, display_name, video_learning_credits, notes_generation_credits,
                            price_gbp, description, is_popular, discount_percentage, badge_text, sort_order)
VALUES
    (
        'starter',
        'Starter Pack',
        60,  -- 60 mins video
        240, -- 240 mins notes
        7.00,
        'Perfect for trying out the platform',
        false,
        0,
        NULL,
        1
    ),
    (
        'popular',
        'Popular Pack',
        150, -- 150 mins video
        600, -- 600 mins notes
        13.00,
        'Most popular choice for casual learners',
        true,
        17, -- 17% discount vs buying monthly
        'Best Value',
        2
    ),
    (
        'power',
        'Power Pack',
        300, -- 300 mins video
        1200, -- 1200 mins notes
        24.00,
        'Great for heavy users',
        false,
        25, -- 25% discount
        'Save 25%',
        3
    ),
    (
        'mega',
        'Mega Pack',
        600, -- 600 mins video
        2500, -- 2500 mins notes
        40.00,
        'Maximum value for professionals',
        false,
        38, -- 38% discount
        'Save 38%',
        4
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON credit_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_credit_packages_sort ON credit_packages(sort_order);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_polar_checkout ON credit_purchases(polar_checkout_id);

-- Enable Row Level Security
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_packages (public read)
CREATE POLICY "Anyone can view active credit packages"
    ON credit_packages FOR SELECT
    USING (is_active = true);

CREATE POLICY "Only admins can modify credit packages"
    ON credit_packages FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for credit_purchases
CREATE POLICY "Users can view their own purchases"
    ON credit_purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
    ON credit_purchases FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert purchases"
    ON credit_purchases FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update purchases"
    ON credit_purchases FOR UPDATE
    USING (true);

-- Update users table to track total credits purchased
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_credits_purchased_video INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_credits_purchased_notes INTEGER DEFAULT 0;

-- Create function to add purchased credits to user account
CREATE OR REPLACE FUNCTION apply_credit_purchase()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Add credits to user's account
        UPDATE users
        SET
            transcription_credits = COALESCE(transcription_credits, 0) + NEW.video_learning_credits,
            notes_credits = COALESCE(notes_credits, 0) + NEW.notes_generation_credits,
            total_credits_purchased_video = COALESCE(total_credits_purchased_video, 0) + NEW.video_learning_credits,
            total_credits_purchased_notes = COALESCE(total_credits_purchased_notes, 0) + NEW.notes_generation_credits,
            updated_at = NOW()
        WHERE id = NEW.user_id;

        -- Log the credit addition
        INSERT INTO credit_history (
            user_id,
            credit_type,
            amount,
            operation,
            balance_before,
            balance_after,
            description,
            metadata
        )
        SELECT
            NEW.user_id,
            'transcription',
            NEW.video_learning_credits,
            'add',
            u.transcription_credits - NEW.video_learning_credits,
            u.transcription_credits,
            'Pay as You Go credit purchase',
            jsonb_build_object(
                'purchase_id', NEW.id,
                'package_id', NEW.package_id,
                'amount_paid', NEW.amount_gbp
            )
        FROM users u
        WHERE u.id = NEW.user_id;

        INSERT INTO credit_history (
            user_id,
            credit_type,
            amount,
            operation,
            balance_before,
            balance_after,
            description,
            metadata
        )
        SELECT
            NEW.user_id,
            'notes',
            NEW.notes_generation_credits,
            'add',
            u.notes_credits - NEW.notes_generation_credits,
            u.notes_credits,
            'Pay as You Go credit purchase',
            jsonb_build_object(
                'purchase_id', NEW.id,
                'package_id', NEW.package_id,
                'amount_paid', NEW.amount_gbp
            )
        FROM users u
        WHERE u.id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-apply credits when purchase is completed
DROP TRIGGER IF EXISTS apply_credit_purchase_trigger ON credit_purchases;
CREATE TRIGGER apply_credit_purchase_trigger
    AFTER UPDATE ON credit_purchases
    FOR EACH ROW
    EXECUTE FUNCTION apply_credit_purchase();
