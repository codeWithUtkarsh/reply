# Pricing Model Documentation

This document describes the pricing model implementation for the video learning application.

## Overview

The application offers three pricing tiers to cater to different user needs:
- **Free Plan**: For casual learners to try the platform
- **Student Plan**: For regular students with moderate usage needs
- **Professional Plan**: For power users and professionals with high usage requirements

## Pricing Tiers

### Free Plan
- **Price**: £0/month (Free)
- **Video Learning Credits**: 75 minutes (about 5-7 full learning sessions)
- **Notes Generation Credits**: 300 minutes
- **Streak Savings**: 0% (no streak bonuses)
- **Referral Commission**: 10% of first payment when referral subscribes
- **Min Withdrawal**: £0
- **Special Features**: None
- **Target Audience**: New users wanting to try the platform

### Student Plan
- **Price**: £9/month
- **Video Learning Credits**: 180 minutes
- **Notes Generation Credits**: 900 minutes
- **Streak Savings**: 20% of credits saved when maintaining streak
- **Referral Commission**: 15% of first payment
- **Min Withdrawal**: £20
- **Special Features**: None
- **Target Audience**: Students with regular learning needs

### Professional Plan
- **Price**: £59/month
- **Video Learning Credits**: 900 minutes
- **Notes Generation Credits**: 5,000 minutes
- **Streak Savings**: 50% of credits saved when maintaining streak
- **Referral Commission**: 15% of first payment
- **Min Withdrawal**: £10
- **Special Features**:
  - Priority processing for faster video transcription and note generation
  - Bulk export features for downloading multiple resources
- **Target Audience**: Professionals, researchers, and power users

## Technical Implementation

### Database Schema

#### Tables Created:
1. **pricing_plans**: Stores all pricing plan configurations
2. **subscriptions**: Tracks user subscriptions and credit balances
3. **referrals**: Manages referral program tracking and commissions

#### Automatic Features:
- New users are automatically assigned a Free plan
- Credits automatically reset at the end of each billing period
- User's current subscription is tracked in the users table

### Backend API Endpoints

#### Pricing Plans
- `GET /api/subscriptions/plans` - Get all active pricing plans
- `GET /api/subscriptions/plans/{plan_id}` - Get specific plan details

#### Subscriptions
- `GET /api/subscriptions/subscription/{user_id}` - Get user's current subscription
- `POST /api/subscriptions/subscription/{user_id}` - Create/upgrade subscription
- `PATCH /api/subscriptions/subscription/{subscription_id}` - Update subscription
- `DELETE /api/subscriptions/subscription/{subscription_id}` - Cancel subscription

#### Credits Management
- `POST /api/subscriptions/credits/check/{user_id}` - Check if user has enough credits
- `POST /api/subscriptions/credits/deduct/{user_id}` - Deduct credits from subscription

#### Referrals
- `GET /api/subscriptions/referrals/{user_id}` - Get referral statistics

### Frontend Integration

#### Pages:
- `/pricing` - Pricing page displaying all plans with subscribe buttons
- `/credits` - Existing credit history page (can be enhanced to show subscription info)

#### API Integration:
- `subscriptionsApi` module in `/frontend/lib/api.ts` provides TypeScript-safe API calls
- All subscription types are fully typed with TypeScript interfaces

## Feature Highlights

### 1. Referral Program
- Users earn commission when their referrals subscribe to paid plans
- Commission rates vary by plan (10% for Free, 15% for Student/Professional)
- Minimum withdrawal amounts prevent small transaction fees
- Tracked in the `referrals` table with payment status

### 2. Streak Bonuses
- Student plan: Save 20% of credits when maintaining learning streak
- Professional plan: Save 50% of credits when maintaining learning streak
- Encourages consistent platform usage and engagement

### 3. Credit System Integration
- Subscriptions provide monthly credit allocations
- Credits stored in subscription record, not user profile
- Credits reset automatically at the end of each billing period
- Separate tracking for video learning and notes generation credits

### 4. Upgrade/Downgrade Flow
- Users can upgrade or downgrade plans at any time
- Previous subscription is cancelled automatically
- New plan credits are applied immediately
- Subscription history is maintained for analytics

## Migration Instructions

### Running the Database Migration

To set up the pricing model in your Supabase database:

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration file: `/backend/migrations/add_pricing_plans.sql`
4. Verify tables were created:
   - pricing_plans
   - subscriptions
   - referrals

### Post-Migration Steps

1. **Verify Default Plans**: Check that the three pricing plans were inserted correctly
   ```sql
   SELECT * FROM pricing_plans ORDER BY sort_order;
   ```

2. **Test Auto-Assignment**: Create a test user and verify they get the free plan automatically

3. **Test Subscription Flow**: Use the frontend pricing page to test subscription creation

## Payment Integration (Future Enhancement)

The current implementation includes placeholders for Stripe integration:
- `stripe_subscription_id` in subscriptions table
- `stripe_customer_id` in subscriptions table
- `stripe_payment_method_id` parameter in subscription creation

To fully integrate Stripe:
1. Add Stripe SDK to backend dependencies
2. Create Stripe customer on user signup
3. Handle payment method creation and subscription activation
4. Implement webhook handlers for subscription events (payment succeeded, failed, etc.)
5. Add payment UI to the pricing page

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only view their own subscriptions and referrals
- Admins have full access to all data
- Pricing plans are publicly readable (active plans only)

### Credit Validation
- Credit deduction endpoints validate sufficient balance before deducting
- Failed transactions don't modify credits
- All credit operations are logged for audit trail

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] New users get free plan automatically
- [ ] Pricing page displays all three plans correctly
- [ ] Users can subscribe to Student plan
- [ ] Users can subscribe to Professional plan
- [ ] Credits are properly allocated on subscription
- [ ] Credits properly deduct when using features
- [ ] Current subscription displays correctly
- [ ] Users can upgrade from Free to Student
- [ ] Users can upgrade from Student to Professional
- [ ] Users can downgrade from Professional to Student
- [ ] Referral tracking works correctly

## Analytics & Metrics

Key metrics to track:
- Conversion rate from Free to paid plans
- Monthly Recurring Revenue (MRR) by plan
- Average credits used per plan
- Referral program effectiveness
- Churn rate by plan
- Credit utilization rates

## Future Enhancements

1. **Annual Billing**: Add yearly subscription options with discounts
2. **Custom Enterprise Plans**: For organizations with specific needs
3. **Add-on Credits**: Allow users to purchase additional credits
4. **Family/Team Plans**: Shared subscriptions for multiple users
5. **Promo Codes**: Discount codes for marketing campaigns
6. **Trial Periods**: Extended trial for Student/Professional plans
7. **Usage Analytics**: Detailed dashboards showing credit consumption patterns
8. **Smart Recommendations**: Suggest plan upgrades based on usage patterns

## Support & Documentation

For issues or questions about the pricing model:
- Backend models: `/backend/models.py`
- Backend routes: `/backend/routes/subscriptions.py`
- Frontend page: `/frontend/app/pricing/page.tsx`
- Frontend API: `/frontend/lib/api.ts`
- Database migration: `/backend/migrations/add_pricing_plans.sql`
