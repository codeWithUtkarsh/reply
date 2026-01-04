from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
import json

from database import db
from models import (
    PricingPlan,
    PricingPlanFeatures,
    Subscription,
    SubscriptionCreate,
    SubscriptionUpdate,
    Referral,
    ReferralStats
)
from fastapi.concurrency import run_in_threadpool

router = APIRouter()


def parse_plan_features(features_json) -> PricingPlanFeatures:
    """Parse JSONB features field into PricingPlanFeatures model"""
    if isinstance(features_json, str):
        features_dict = json.loads(features_json)
    else:
        features_dict = features_json or {}

    return PricingPlanFeatures(**features_dict)


def row_to_pricing_plan(row: dict) -> PricingPlan:
    """Convert database row to PricingPlan model"""
    features = parse_plan_features(row.get('features', {}))

    return PricingPlan(
        id=row['id'],
        name=row['name'],
        display_name=row['display_name'],
        price_gbp=float(row['price_gbp']),
        billing_period=row.get('billing_period', 'monthly'),
        video_learning_credits=row['video_learning_credits'],
        notes_generation_credits=row['notes_generation_credits'],
        streak_credit_save_percentage=row.get('streak_credit_save_percentage', 0),
        referral_percentage=float(row.get('referral_percentage', 0.0)),
        min_withdrawal_gbp=float(row.get('min_withdrawal_gbp', 0.0)),
        features=features,
        is_active=row.get('is_active', True),
        sort_order=row.get('sort_order', 0),
        description=row.get('description'),
        created_at=str(row.get('created_at')) if row.get('created_at') else None,
        updated_at=str(row.get('updated_at')) if row.get('updated_at') else None
    )


def row_to_subscription(row: dict, plan: Optional[PricingPlan] = None) -> Subscription:
    """Convert database row to Subscription model"""
    return Subscription(
        id=row['id'],
        user_id=row['user_id'],
        plan_id=row['plan_id'],
        plan=plan,
        status=row['status'],
        start_date=str(row['start_date']) if row.get('start_date') else None,
        current_period_start=str(row['current_period_start']) if row.get('current_period_start') else None,
        current_period_end=str(row['current_period_end']) if row.get('current_period_end') else None,
        cancelled_at=str(row['cancelled_at']) if row.get('cancelled_at') else None,
        stripe_subscription_id=row.get('stripe_subscription_id'),
        stripe_customer_id=row.get('stripe_customer_id'),
        video_learning_credits_remaining=row.get('video_learning_credits_remaining', 0),
        notes_generation_credits_remaining=row.get('notes_generation_credits_remaining', 0),
        credits_reset_at=str(row['credits_reset_at']) if row.get('credits_reset_at') else None,
        metadata=row.get('metadata'),
        created_at=str(row['created_at']) if row.get('created_at') else None,
        updated_at=str(row['updated_at']) if row.get('updated_at') else None
    )


@router.get("/plans", response_model=List[PricingPlan])
async def get_pricing_plans():
    """
    Get all active pricing plans
    """
    response = await run_in_threadpool(
        lambda: db.client.table('pricing_plans')
        .select('*')
        .eq('is_active', True)
        .order('sort_order')
        .execute()
    )

    if not response.data:
        return []

    plans = [row_to_pricing_plan(row) for row in response.data]
    return plans


@router.get("/plans/{plan_id}", response_model=PricingPlan)
async def get_pricing_plan(plan_id: str):
    """
    Get a specific pricing plan by ID
    """
    response = await run_in_threadpool(
        lambda: db.client.table('pricing_plans')
        .select('*')
        .eq('id', plan_id)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Pricing plan not found")

    return row_to_pricing_plan(response.data)


@router.get("/subscription/{user_id}", response_model=Subscription)
async def get_user_subscription(user_id: str):
    """
    Get current active subscription for a user
    """
    # Get active subscription
    sub_response = await run_in_threadpool(
        lambda: db.client.table('subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .single()
        .execute()
    )

    if not sub_response.data:
        raise HTTPException(status_code=404, detail="No active subscription found")

    subscription_data = sub_response.data

    # Get plan details
    plan_response = await run_in_threadpool(
        lambda: db.client.table('pricing_plans')
        .select('*')
        .eq('id', subscription_data['plan_id'])
        .single()
        .execute()
    )

    plan = row_to_pricing_plan(plan_response.data) if plan_response.data else None

    return row_to_subscription(subscription_data, plan)


@router.post("/subscription/{user_id}", response_model=Subscription)
async def create_subscription(user_id: str, subscription: SubscriptionCreate):
    """
    Create or upgrade a subscription for a user
    """
    # Get the plan details
    plan_response = await run_in_threadpool(
        lambda: db.client.table('pricing_plans')
        .select('*')
        .eq('id', subscription.plan_id)
        .single()
        .execute()
    )

    if not plan_response.data:
        raise HTTPException(status_code=404, detail="Pricing plan not found")

    plan = row_to_pricing_plan(plan_response.data)

    # Check if user already has an active subscription
    existing_sub = await run_in_threadpool(
        lambda: db.client.table('subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .execute()
    )

    if existing_sub.data:
        # Cancel existing subscription
        await run_in_threadpool(
            lambda: db.client.table('subscriptions')
            .update({
                'status': 'cancelled',
                'cancelled_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            })
            .eq('id', existing_sub.data[0]['id'])
            .execute()
        )

    # Calculate subscription period
    current_period_end = datetime.now() + timedelta(days=30 if plan.billing_period == 'monthly' else 365)
    credits_reset_at = current_period_end

    # Create new subscription
    new_subscription = {
        'user_id': user_id,
        'plan_id': subscription.plan_id,
        'status': 'active',
        'start_date': datetime.now().isoformat(),
        'current_period_start': datetime.now().isoformat(),
        'current_period_end': current_period_end.isoformat(),
        'video_learning_credits_remaining': plan.video_learning_credits,
        'notes_generation_credits_remaining': plan.notes_generation_credits,
        'credits_reset_at': credits_reset_at.isoformat(),
        'stripe_payment_method_id': subscription.stripe_payment_method_id,
        'metadata': {}
    }

    response = await run_in_threadpool(
        lambda: db.client.table('subscriptions')
        .insert(new_subscription)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create subscription")

    # Handle referral if provided
    if subscription.referral_code:
        # Find referrer by referral code (you may need to implement referral code generation)
        # For now, we'll skip this part - can be implemented later
        pass

    return row_to_subscription(response.data[0], plan)


@router.patch("/subscription/{subscription_id}", response_model=Subscription)
async def update_subscription(subscription_id: str, update: SubscriptionUpdate):
    """
    Update a subscription (change plan, cancel, etc.)
    """
    # Get existing subscription
    existing_sub = await run_in_threadpool(
        lambda: db.client.table('subscriptions')
        .select('*')
        .eq('id', subscription_id)
        .single()
        .execute()
    )

    if not existing_sub.data:
        raise HTTPException(status_code=404, detail="Subscription not found")

    update_data = {'updated_at': datetime.now().isoformat()}

    # Handle plan change
    if update.plan_id:
        plan_response = await run_in_threadpool(
            lambda: db.client.table('pricing_plans')
            .select('*')
            .eq('id', update.plan_id)
            .single()
            .execute()
        )

        if not plan_response.data:
            raise HTTPException(status_code=404, detail="Pricing plan not found")

        plan = row_to_pricing_plan(plan_response.data)
        update_data['plan_id'] = update.plan_id
        update_data['video_learning_credits_remaining'] = plan.video_learning_credits
        update_data['notes_generation_credits_remaining'] = plan.notes_generation_credits

    # Handle status change (e.g., cancellation)
    if update.status:
        update_data['status'] = update.status
        if update.status == 'cancelled':
            update_data['cancelled_at'] = datetime.now().isoformat()

    # Update subscription
    response = await run_in_threadpool(
        lambda: db.client.table('subscriptions')
        .update(update_data)
        .eq('id', subscription_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update subscription")

    # Get updated subscription with plan
    updated_sub = response.data[0]
    plan_response = await run_in_threadpool(
        lambda: db.client.table('pricing_plans')
        .select('*')
        .eq('id', updated_sub['plan_id'])
        .single()
        .execute()
    )

    plan = row_to_pricing_plan(plan_response.data) if plan_response.data else None

    return row_to_subscription(updated_sub, plan)


@router.delete("/subscription/{subscription_id}")
async def cancel_subscription(subscription_id: str):
    """
    Cancel a subscription
    """
    response = await run_in_threadpool(
        lambda: db.client.table('subscriptions')
        .update({
            'status': 'cancelled',
            'cancelled_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        })
        .eq('id', subscription_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return {"message": "Subscription cancelled successfully"}


@router.get("/referrals/{user_id}", response_model=ReferralStats)
async def get_referral_stats(user_id: str):
    """
    Get referral statistics for a user
    """
    # Get all referrals where user is the referrer
    response = await run_in_threadpool(
        lambda: db.client.table('referrals')
        .select('*')
        .eq('referrer_user_id', user_id)
        .execute()
    )

    referrals_data = response.data or []

    # Calculate stats
    total_referrals = len(referrals_data)
    total_commission_earned = sum(float(r.get('commission_amount_gbp', 0)) for r in referrals_data)
    total_commission_pending = sum(
        float(r.get('commission_amount_gbp', 0))
        for r in referrals_data
        if r.get('payment_status') == 'pending'
    )
    total_commission_withdrawn = sum(
        float(r.get('commission_amount_gbp', 0))
        for r in referrals_data
        if r.get('payment_status') == 'withdrawn'
    )

    # Get user's current plan to determine min withdrawal
    sub_response = await run_in_threadpool(
        lambda: db.client.table('subscriptions')
        .select('plan_id')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .single()
        .execute()
    )

    min_withdrawal_amount = 0.0
    if sub_response.data:
        plan_response = await run_in_threadpool(
            lambda: db.client.table('pricing_plans')
            .select('min_withdrawal_gbp')
            .eq('id', sub_response.data['plan_id'])
            .single()
            .execute()
        )

        if plan_response.data:
            min_withdrawal_amount = float(plan_response.data.get('min_withdrawal_gbp', 0))

    can_withdraw = total_commission_pending >= min_withdrawal_amount

    # Convert referrals to models
    referrals = [
        Referral(
            id=r['id'],
            referrer_user_id=r['referrer_user_id'],
            referred_user_id=r['referred_user_id'],
            referral_code=r.get('referral_code'),
            commission_percentage=float(r['commission_percentage']),
            commission_amount_gbp=float(r['commission_amount_gbp']),
            payment_status=r['payment_status'],
            paid_at=str(r['paid_at']) if r.get('paid_at') else None,
            created_at=str(r['created_at']) if r.get('created_at') else None
        )
        for r in referrals_data
    ]

    return ReferralStats(
        total_referrals=total_referrals,
        total_commission_earned=total_commission_earned,
        total_commission_pending=total_commission_pending,
        total_commission_withdrawn=total_commission_withdrawn,
        min_withdrawal_amount=min_withdrawal_amount,
        can_withdraw=can_withdraw,
        referrals=referrals
    )


@router.post("/credits/check/{user_id}")
async def check_subscription_credits(user_id: str, credit_type: str, amount: int):
    """
    Check if user has enough credits in their subscription
    credit_type: 'video' or 'notes'
    """
    # Get active subscription
    response = await run_in_threadpool(
        lambda: db.client.table('subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .single()
        .execute()
    )

    if not response.data:
        return {
            "has_credits": False,
            "remaining": 0,
            "required": amount,
            "message": "No active subscription"
        }

    subscription = response.data

    if credit_type == 'video':
        remaining = subscription.get('video_learning_credits_remaining', 0)
    elif credit_type == 'notes':
        remaining = subscription.get('notes_generation_credits_remaining', 0)
    else:
        raise HTTPException(status_code=400, detail="Invalid credit type")

    has_credits = remaining >= amount

    return {
        "has_credits": has_credits,
        "remaining": remaining,
        "required": amount,
        "message": "Sufficient credits" if has_credits else "Insufficient credits"
    }


@router.post("/credits/deduct/{user_id}")
async def deduct_subscription_credits(user_id: str, credit_type: str, amount: int):
    """
    Deduct credits from user's subscription
    credit_type: 'video' or 'notes'
    """
    # Get active subscription
    response = await run_in_threadpool(
        lambda: db.client.table('subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="No active subscription")

    subscription = response.data

    if credit_type == 'video':
        field_name = 'video_learning_credits_remaining'
        remaining = subscription.get(field_name, 0)
    elif credit_type == 'notes':
        field_name = 'notes_generation_credits_remaining'
        remaining = subscription.get(field_name, 0)
    else:
        raise HTTPException(status_code=400, detail="Invalid credit type")

    if remaining < amount:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Deduct credits
    new_remaining = remaining - amount
    update_response = await run_in_threadpool(
        lambda: db.client.table('subscriptions')
        .update({
            field_name: new_remaining,
            'updated_at': datetime.now().isoformat()
        })
        .eq('id', subscription['id'])
        .execute()
    )

    if not update_response.data:
        raise HTTPException(status_code=500, detail="Failed to deduct credits")

    return {
        "success": True,
        "remaining": new_remaining,
        "deducted": amount
    }
