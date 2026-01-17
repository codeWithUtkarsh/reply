from fastapi import APIRouter, HTTPException, Request, Header
from typing import List, Dict, Optional
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
from polar_service import polar_service
from config import settings

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


# ============================================================================
# Polar Payment Integration Endpoints
# ============================================================================

@router.post("/checkout/create")
async def create_polar_checkout(
    plan_id: str,
    user_id: str,
    user_email: Optional[str] = None,
    user_name: Optional[str] = None,
):
    """
    Create a Polar checkout session for a subscription plan
    
    Args:
        plan_id: The pricing plan ID from our database
        user_id: The user's ID
        user_email: User's email (optional)
        user_name: User's name (optional)
        
    Returns:
        Dict with checkout_url and checkout_id
    """
    try:
        # Get the plan details
        plan_response = await run_in_threadpool(
            lambda: db.client.table('pricing_plans')
            .select('*')
            .eq('id', plan_id)
            .single()
            .execute()
        )
        
        if not plan_response.data:
            raise HTTPException(status_code=404, detail="Pricing plan not found")
        
        plan = row_to_pricing_plan(plan_response.data)
        
        # Free plan doesn't need checkout
        if plan.name.lower() == 'free':
            raise HTTPException(status_code=400, detail="Free plan doesn't require checkout")
        
        # Get Polar product ID for this plan
        polar_product_id = polar_service.get_product_id_for_plan(plan.name)
        
        if not polar_product_id:
            raise HTTPException(
                status_code=500,
                detail=f"Polar product ID not configured for {plan.name} plan"
            )
        
        # Create success URL
        frontend_url = settings.cors_origins.split(',')[0]  # Get first origin
        success_url = f"{frontend_url}/pricing/success?session_id={{CHECKOUT_ID}}"
        
        # Create checkout session
        checkout_session = await polar_service.create_checkout_session(
            product_id=polar_product_id,
            customer_email=user_email,
            customer_name=user_name,
            success_url=success_url,
            allow_discount_codes=True,  # Allow users to enter discount codes
            metadata={
                "user_id": user_id,
                "plan_id": plan_id,
                "plan_name": plan.name,
            }
        )
        
        return {
            "checkout_url": checkout_session.get("url"),
            "checkout_id": checkout_session.get("id"),
            "plan_name": plan.display_name,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")


@router.post("/webhook/polar")
async def handle_polar_webhook(request: Request, polar_signature: str = Header(None)):
    """
    Handle Polar webhook events
    
    Polar sends webhooks for events like:
    - checkout.completed
    - subscription.created
    - subscription.updated
    - subscription.cancelled
    """
    try:
        # Get raw payload
        payload = await request.body()
        
        # Verify webhook signature
        if polar_signature:
            is_valid = await polar_service.verify_webhook_signature(payload, polar_signature)
            if not is_valid:
                raise HTTPException(status_code=401, detail="Invalid webhook signature")
        
        # Parse event data
        event_data = json.loads(payload)
        event_type = event_data.get("type")
        
        # Handle checkout completion
        if event_type == "checkout.completed":
            # Check if it's a subscription or credit purchase based on metadata
            checkout_data = event_data.get("data", {})
            metadata = checkout_data.get("metadata", {})
            purchase_type = metadata.get("purchase_type", "subscription")
            
            if purchase_type == "credits":
                await handle_credit_purchase_completed(event_data)
            else:
                await handle_checkout_completed(event_data)
        elif event_type == "subscription.created":
            await handle_subscription_event(event_data, "created")
        elif event_type == "subscription.updated":
            await handle_subscription_event(event_data, "updated")
        elif event_type == "subscription.cancelled":
            await handle_subscription_event(event_data, "cancelled")
        
        return {"status": "success"}
        
    except Exception as e:
        # Log error but return 200 to prevent Polar from retrying
        print(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


async def handle_checkout_completed(event_data: Dict):
    """
    Handle successful checkout completion
    Create or update subscription in database
    """
    try:
        checkout_data = event_data.get("data", {})
        metadata = checkout_data.get("metadata", {})
        
        user_id = metadata.get("user_id")
        plan_id = metadata.get("plan_id")
        
        if not user_id or not plan_id:
            print(f"Missing metadata in checkout: {metadata}")
            return
        
        # Get plan details
        plan_response = await run_in_threadpool(
            lambda: db.client.table('pricing_plans')
            .select('*')
            .eq('id', plan_id)
            .single()
            .execute()
        )
        
        if not plan_response.data:
            print(f"Plan not found: {plan_id}")
            return
        
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
            'plan_id': plan_id,
            'status': 'active',
            'start_date': datetime.now().isoformat(),
            'current_period_start': datetime.now().isoformat(),
            'current_period_end': current_period_end.isoformat(),
            'video_learning_credits_remaining': plan.video_learning_credits,
            'notes_generation_credits_remaining': plan.notes_generation_credits,
            'credits_reset_at': credits_reset_at.isoformat(),
            'metadata': {
                'polar_checkout_id': checkout_data.get('id'),
                'polar_customer_id': checkout_data.get('customer_id'),
            }
        }
        
        await run_in_threadpool(
            lambda: db.client.table('subscriptions')
            .insert(new_subscription)
            .execute()
        )
        
        print(f"Subscription created for user {user_id}, plan {plan.display_name}")
        
    except Exception as e:
        print(f"Error handling checkout completed: {str(e)}")
        raise


async def handle_subscription_event(event_data: Dict, event_action: str):
    """
    Handle subscription lifecycle events
    """
    try:
        subscription_data = event_data.get("data", {})
        # Implementation depends on Polar's subscription event structure
        print(f"Subscription {event_action}: {subscription_data}")
        
    except Exception as e:
        print(f"Error handling subscription {event_action}: {str(e)}")


@router.get("/checkout/success")
async def checkout_success(session_id: str):
    """
    Handle successful checkout redirect
    Verify the checkout session and return subscription details
    """
    try:
        # Get checkout session from Polar
        checkout_session = await polar_service.get_checkout_session(session_id)
        
        metadata = checkout_session.get("metadata", {})
        user_id = metadata.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid checkout session")
        
        # Get user's active subscription
        sub_response = await run_in_threadpool(
            lambda: db.client.table('subscriptions')
            .select('*')
            .eq('user_id', user_id)
            .eq('status', 'active')
            .single()
            .execute()
        )
        
        if not sub_response.data:
            # Subscription might not be created yet (webhook processing)
            return {
                "status": "processing",
                "message": "Your payment is being processed. Please check back in a moment."
            }
        
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
        
        return {
            "status": "success",
            "subscription": row_to_subscription(subscription_data, plan)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify checkout: {str(e)}")


# ============================================================================
# Pay as You Go Credit Purchase Endpoints
# ============================================================================

def row_to_credit_package(row: dict):
    """Convert database row to CreditPackage model"""
    from models import CreditPackage
    
    return CreditPackage(
        id=row['id'],
        name=row['name'],
        display_name=row['display_name'],
        video_learning_credits=row['video_learning_credits'],
        notes_generation_credits=row['notes_generation_credits'],
        price_gbp=float(row['price_gbp']),
        description=row.get('description'),
        is_popular=row.get('is_popular', False),
        discount_percentage=row.get('discount_percentage', 0),
        badge_text=row.get('badge_text'),
        is_active=row.get('is_active', True),
        sort_order=row.get('sort_order', 0),
        created_at=str(row.get('created_at')) if row.get('created_at') else None,
        updated_at=str(row.get('updated_at')) if row.get('updated_at') else None
    )


def row_to_credit_purchase(row: dict, package=None):
    """Convert database row to CreditPurchase model"""
    from models import CreditPurchase
    
    return CreditPurchase(
        id=row['id'],
        user_id=row['user_id'],
        package_id=row['package_id'],
        package=package,
        video_learning_credits=row['video_learning_credits'],
        notes_generation_credits=row['notes_generation_credits'],
        amount_gbp=float(row['amount_gbp']),
        polar_checkout_id=row.get('polar_checkout_id'),
        polar_transaction_id=row.get('polar_transaction_id'),
        status=row['status'],
        completed_at=str(row['completed_at']) if row.get('completed_at') else None,
        metadata=row.get('metadata'),
        created_at=str(row.get('created_at')) if row.get('created_at') else None,
        updated_at=str(row.get('updated_at')) if row.get('updated_at') else None
    )


@router.get("/credit-packages")
async def get_credit_packages():
    """
    Get all active Pay as You Go credit packages
    """
    from models import CreditPackage
    
    response = await run_in_threadpool(
        lambda: db.client.table('credit_packages')
        .select('*')
        .eq('is_active', True)
        .order('sort_order')
        .execute()
    )

    if not response.data:
        return []

    packages = [row_to_credit_package(row) for row in response.data]
    return packages


@router.post("/credits/purchase/create")
async def create_credit_purchase(
    package_id: str,
    user_id: str,
    user_email: Optional[str] = None,
):
    """
    Create a one-time credit purchase checkout session
    
    Args:
        package_id: The credit package ID
        user_id: The user's ID
        user_email: User's email (optional)
        
    Returns:
        Dict with checkout_url and purchase_id
    """
    try:
        # Get the package details
        package_response = await run_in_threadpool(
            lambda: db.client.table('credit_packages')
            .select('*')
            .eq('id', package_id)
            .single()
            .execute()
        )
        
        if not package_response.data:
            raise HTTPException(status_code=404, detail="Credit package not found")
        
        package = row_to_credit_package(package_response.data)
        
        # Create purchase record
        purchase_data = {
            'user_id': user_id,
            'package_id': package_id,
            'video_learning_credits': package.video_learning_credits,
            'notes_generation_credits': package.notes_generation_credits,
            'amount_gbp': float(package.price_gbp),
            'status': 'pending',
        }
        
        purchase_response = await run_in_threadpool(
            lambda: db.client.table('credit_purchases')
            .insert(purchase_data)
            .execute()
        )
        
        if not purchase_response.data:
            raise HTTPException(status_code=500, detail="Failed to create purchase record")
        
        purchase = purchase_response.data[0]

        # Map credit package to Polar product ID
        package_product_map = {
            'starter': settings.polar_credit_starter_product_id,
            'popular': settings.polar_credit_popular_product_id,
            'power': settings.polar_credit_power_product_id,
            'mega': settings.polar_credit_mega_product_id,
        }

        polar_product_id = package_product_map.get(package.name)

        if not polar_product_id:
            raise HTTPException(
                status_code=500,
                detail=f"Polar product not configured for {package.display_name}"
            )
        
        # Create success URL
        frontend_url = settings.cors_origins.split(',')[0]
        success_url = f"{frontend_url}/credits/purchase/success?purchase_id={{CHECKOUT_ID}}"
        
        # Create one-time checkout session
        checkout_session = await polar_service.create_checkout_session(
            product_id=polar_product_id,
            customer_email=user_email,
            success_url=success_url,
            is_subscription=False,  # One-time purchase
            allow_discount_codes=True,  # Allow users to enter discount codes
            metadata={
                "user_id": user_id,
                "purchase_id": purchase['id'],
                "package_id": package_id,
                "purchase_type": "credits",
            }
        )
        
        # Update purchase with checkout ID
        await run_in_threadpool(
            lambda: db.client.table('credit_purchases')
            .update({'polar_checkout_id': checkout_session.get('id')})
            .eq('id', purchase['id'])
            .execute()
        )
        
        return {
            "checkout_url": checkout_session.get("url"),
            "checkout_id": checkout_session.get("id"),
            "purchase_id": purchase['id'],
            "package_name": package.display_name,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")


@router.post("/credits/purchase/custom")
async def create_custom_credit_purchase(
    amount_gbp: float,
    user_id: str,
    user_email: Optional[str] = None,
):
    """
    Create a custom amount credit purchase checkout session
    £1 = 20 credits (both video and notes)

    Args:
        amount_gbp: The amount in GBP (minimum £2)
        user_id: The user's ID
        user_email: User's email (optional)

    Returns:
        Dict with checkout_url and purchase_id
    """
    try:
        # Validate amount
        if amount_gbp < 2:
            raise HTTPException(status_code=400, detail="Minimum amount is £2")

        if amount_gbp > 1000:
            raise HTTPException(status_code=400, detail="Maximum amount is £1,000")

        # Calculate credits: £1 = 20 credits
        credits_per_pound = 20
        total_credits = int(amount_gbp * credits_per_pound)

        # Create purchase record (without package_id for custom purchases)
        purchase_data = {
            'user_id': user_id,
            'package_id': None,  # Custom purchase, no package
            'video_learning_credits': total_credits,
            'notes_generation_credits': total_credits,
            'amount_gbp': float(amount_gbp),
            'status': 'pending',
            'metadata': {
                'purchase_type': 'custom',
                'credits_per_pound': credits_per_pound
            }
        }

        purchase_response = await run_in_threadpool(
            lambda: db.client.table('credit_purchases')
            .insert(purchase_data)
            .execute()
        )

        if not purchase_response.data:
            raise HTTPException(status_code=500, detail="Failed to create purchase record")

        purchase = purchase_response.data[0]

        # Get flexible PAYG product ID
        polar_product_id = settings.polar_payg_flexible_product_id

        if not polar_product_id:
            raise HTTPException(
                status_code=500,
                detail="Polar flexible product not configured. Please add POLAR_PAYG_FLEXIBLE_PRODUCT_ID to your .env"
            )

        # Create success URL
        frontend_url = settings.cors_origins.split(',')[0]
        success_url = f"{frontend_url}/credits/purchase/success?purchase_id={{CHECKOUT_ID}}"

        # Create one-time checkout session with custom amount
        checkout_session = await polar_service.create_checkout_session(
            product_id=polar_product_id,
            customer_email=user_email,
            success_url=success_url,
            is_subscription=False,  # One-time purchase
            allow_discount_codes=True,  # Allow users to enter discount codes
            metadata={
                "user_id": user_id,
                "purchase_id": purchase['id'],
                "purchase_type": "custom_credits",
                "amount_gbp": str(amount_gbp),
                "total_credits": str(total_credits),
            }
        )

        # Update purchase with checkout ID
        await run_in_threadpool(
            lambda: db.client.table('credit_purchases')
            .update({'polar_checkout_id': checkout_session.get('id')})
            .eq('id', purchase['id'])
            .execute()
        )

        return {
            "checkout_url": checkout_session.get("url"),
            "checkout_id": checkout_session.get("id"),
            "purchase_id": purchase['id'],
            "amount_gbp": amount_gbp,
            "total_credits": total_credits,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")


@router.get("/credits/purchase/history/{user_id}")
async def get_purchase_history(user_id: str):
    """
    Get user's credit purchase history
    """
    from models import CreditPurchaseHistory
    
    response = await run_in_threadpool(
        lambda: db.client.table('credit_purchases')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'completed')
        .order('created_at', desc=True)
        .execute()
    )

    purchases_data = response.data or []
    
    # Get packages for each purchase
    purchases = []
    for purchase_row in purchases_data:
        package_response = await run_in_threadpool(
            lambda: db.client.table('credit_packages')
            .select('*')
            .eq('id', purchase_row['package_id'])
            .single()
            .execute()
        )
        
        package = row_to_credit_package(package_response.data) if package_response.data else None
        purchases.append(row_to_credit_purchase(purchase_row, package))
    
    total_spent = sum(float(p.amount_gbp) for p in purchases)
    total_video_credits = sum(p.video_learning_credits for p in purchases)
    total_notes_credits = sum(p.notes_generation_credits for p in purchases)
    
    return CreditPurchaseHistory(
        purchases=purchases,
        total_spent=total_spent,
        total_video_credits=total_video_credits,
        total_notes_credits=total_notes_credits
    )


@router.get("/credits/purchase/success")
async def credit_purchase_success(purchase_id: str):
    """
    Handle successful credit purchase redirect
    Verify the purchase and return details
    """
    try:
        # Get purchase record
        purchase_response = await run_in_threadpool(
            lambda: db.client.table('credit_purchases')
            .select('*')
            .eq('id', purchase_id)
            .single()
            .execute()
        )
        
        if not purchase_response.data:
            raise HTTPException(status_code=404, detail="Purchase not found")
        
        purchase_data = purchase_response.data
        
        # Get package details
        package_response = await run_in_threadpool(
            lambda: db.client.table('credit_packages')
            .select('*')
            .eq('id', purchase_data['package_id'])
            .single()
            .execute()
        )
        
        package = row_to_credit_package(package_response.data) if package_response.data else None
        
        # Check if purchase is completed
        if purchase_data['status'] == 'pending':
            return {
                "status": "processing",
                "message": "Your payment is being processed. Please check back in a moment."
            }
        
        return {
            "status": "success",
            "purchase": row_to_credit_purchase(purchase_data, package)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify purchase: {str(e)}")


# Update webhook handler to process credit purchases
async def handle_credit_purchase_completed(event_data: Dict):
    """
    Handle successful credit purchase completion
    Marks purchase as completed and adds credits to user's account
    """
    try:
        checkout_data = event_data.get("data", {})
        metadata = checkout_data.get("metadata", {})

        purchase_id = metadata.get("purchase_id")

        if not purchase_id:
            print(f"Missing purchase_id in checkout metadata: {metadata}")
            return

        # Get purchase details first
        purchase_response = await run_in_threadpool(
            lambda: db.client.table('credit_purchases')
            .select('*')
            .eq('id', purchase_id)
            .single()
            .execute()
        )

        if not purchase_response.data:
            print(f"Purchase not found: {purchase_id}")
            return

        purchase = purchase_response.data
        user_id = purchase['user_id']
        video_credits = purchase['video_learning_credits']
        notes_credits = purchase['notes_generation_credits']
        amount_gbp = purchase['amount_gbp']

        # Get user's current credit balance for logging
        user = await db.get_user_profile(user_id)
        if not user:
            print(f"User not found: {user_id}")
            return

        video_balance_before = user.get('transcription_credits', 0)
        notes_balance_before = user.get('notes_credits', 0)

        # Update purchase status to completed
        await run_in_threadpool(
            lambda: db.client.table('credit_purchases')
            .update({
                'status': 'completed',
                'completed_at': datetime.now().isoformat(),
                'polar_transaction_id': checkout_data.get('id'),
                'updated_at': datetime.now().isoformat()
            })
            .eq('id', purchase_id)
            .execute()
        )

        # Add credits to user's account
        await db.add_credits(
            user_id=user_id,
            transcription_credits=video_credits,
            notes_credits=notes_credits
        )

        # Log video credits transaction in credit_history
        await run_in_threadpool(
            lambda: db.client.table('credit_history')
            .insert({
                'user_id': user_id,
                'credit_type': 'transcription',
                'amount': video_credits,
                'operation': 'add',
                'balance_before': video_balance_before,
                'balance_after': video_balance_before + video_credits,
                'description': f'Credit purchase - {amount_gbp} GBP',
                'metadata': {
                    'purchase_id': purchase_id,
                    'package_id': purchase.get('package_id'),
                    'amount_gbp': str(amount_gbp),
                    'source': 'credit_purchase'
                }
            })
            .execute()
        )

        # Log notes credits transaction in credit_history
        await run_in_threadpool(
            lambda: db.client.table('credit_history')
            .insert({
                'user_id': user_id,
                'credit_type': 'notes',
                'amount': notes_credits,
                'operation': 'add',
                'balance_before': notes_balance_before,
                'balance_after': notes_balance_before + notes_credits,
                'description': f'Credit purchase - {amount_gbp} GBP',
                'metadata': {
                    'purchase_id': purchase_id,
                    'package_id': purchase.get('package_id'),
                    'amount_gbp': str(amount_gbp),
                    'source': 'credit_purchase'
                }
            })
            .execute()
        )

        print(f"Credit purchase completed: {purchase_id} - Added {video_credits} video credits and {notes_credits} notes credits to user {user_id}")

    except Exception as e:
        print(f"Error handling credit purchase completed: {str(e)}")
        raise
