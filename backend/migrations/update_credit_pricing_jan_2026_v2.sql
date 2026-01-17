-- Migration: Update Credit Package Pricing - January 2026 v2
-- Description: Updates credit package prices to new structure
--              - Starter: £5.00 (no change)
--              - Popular: £13.00 → £15.00
--              - Power: £24.00 → £30.00
--              - Mega: £40.00 → £45.00
-- Safe to run: Yes, uses UPDATE statements

-- Update Popular Pack pricing
UPDATE credit_packages
SET price_gbp = 15.00,
    updated_at = NOW()
WHERE name = 'popular';

-- Update Power Pack pricing
UPDATE credit_packages
SET price_gbp = 30.00,
    updated_at = NOW()
WHERE name = 'power';

-- Update Mega Pack pricing
UPDATE credit_packages
SET price_gbp = 45.00,
    updated_at = NOW()
WHERE name = 'mega';

-- Success message
SELECT
    'Credit package pricing migration completed successfully!' as message,
    (SELECT price_gbp FROM credit_packages WHERE name = 'starter') as starter_price,
    (SELECT price_gbp FROM credit_packages WHERE name = 'popular') as popular_price,
    (SELECT price_gbp FROM credit_packages WHERE name = 'power') as power_price,
    (SELECT price_gbp FROM credit_packages WHERE name = 'mega') as mega_price;
