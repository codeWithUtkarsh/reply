# Polar Payment Integration Guide

This document explains how to set up and use the Polar.sh payment integration for subscription management.

## Overview

The application uses [Polar.sh](https://polar.sh) as the payment processor for handling subscription payments. Polar provides:
- Secure checkout sessions
- Subscription management
- Webhook notifications for payment events
- Global merchant of record handling

## Setup Instructions

### 1. Create a Polar Account

1. Go to [polar.sh](https://polar.sh) and create an account
2. Create an organization for your application
3. Note your Organization ID from the dashboard

### 2. Create Products in Polar

Create two products in your Polar dashboard:

**Student Plan Product:**
- Name: "Student Plan"
- Price: £9/month
- Billing Period: Monthly
- Copy the Product ID

**Professional Plan Product:**
- Name: "Professional Plan"
- Price: £59/month
- Billing Period: Monthly
- Copy the Product ID

Note: The Free plan doesn't need a Polar product as it's handled directly in the application.

### 3. Get API Credentials

From your Polar dashboard:
1. Go to Settings → API
2. Generate an Access Token
3. Copy the Webhook Secret

### 4. Configure Environment Variables

Add the following to your `backend/.env` file:

```env
# Polar Payment Configuration
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
POLAR_ORGANIZATION_ID=org_xxxxxxxxxxxxx

# Product IDs
POLAR_STUDENT_PRODUCT_ID=prod_student_xxxxxxxxx
POLAR_PROFESSIONAL_PRODUCT_ID=prod_professional_xxxxxxxxx
```

### 5. Set Up Webhooks

Configure webhooks in your Polar dashboard:

**Webhook URL:** `https://yourdomain.com/api/subscriptions/webhook/polar`

**Events to subscribe to:**
- `checkout.completed`
- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`

## How It Works

### Payment Flow

1. **User selects a plan** on the pricing page
2. **Frontend calls** `POST /api/subscriptions/checkout/create` with:
   - `plan_id`: Database plan ID
   - `user_id`: User's ID
   - `user_email`: User's email (optional)

3. **Backend creates** a Polar checkout session with:
   - Product ID mapped from the plan
   - Customer information
   - Success URL with session ID
   - Metadata (user_id, plan_id)

4. **User is redirected** to Polar's secure checkout page

5. **After payment**, user is redirected to:
   `/pricing/success?session_id={CHECKOUT_ID}`

6. **Success page** calls `GET /api/subscriptions/checkout/success` to verify

7. **Webhook handler** receives `checkout.completed` event and:
   - Creates subscription in database
   - Allocates credits to user
   - Cancels any existing subscriptions

### Webhook Events

**checkout.completed**
- Triggered when payment is successful
- Creates/updates subscription in database
- Allocates initial credits

**subscription.created**
- Triggered when subscription is activated
- Can be used for additional processing

**subscription.updated**
- Triggered when subscription changes (upgrade/downgrade)
- Updates subscription record

**subscription.cancelled**
- Triggered when subscription is cancelled
- Updates subscription status

## API Endpoints

### Create Checkout Session
```
POST /api/subscriptions/checkout/create
Query Parameters:
  - plan_id: string (required)
  - user_id: string (required)
  - user_email: string (optional)
  
Response:
{
  "checkout_url": "https://polar.sh/checkout/...",
  "checkout_id": "checkout_123...",
  "plan_name": "Student"
}
```

### Verify Checkout Success
```
GET /api/subscriptions/checkout/success?session_id={checkout_id}

Response (Success):
{
  "status": "success",
  "subscription": {
    "id": "...",
    "plan": {...},
    "video_learning_credits_remaining": 180,
    "notes_generation_credits_remaining": 900,
    ...
  }
}

Response (Processing):
{
  "status": "processing",
  "message": "Your payment is being processed..."
}
```

### Webhook Handler
```
POST /api/subscriptions/webhook/polar
Headers:
  - polar-signature: string (webhook signature)
Body: Polar webhook event payload
```

## Testing

### Local Testing with Polar CLI

1. Install Polar CLI (if available):
   ```bash
   npm install -g @polar-sh/cli
   ```

2. Forward webhooks to local:
   ```bash
   polar webhooks forward --to http://localhost:8000/api/subscriptions/webhook/polar
   ```

### Test Payments

Polar provides test mode for development. Use test card numbers provided in Polar documentation.

## Security

### Webhook Signature Verification

All webhooks are verified using HMAC-SHA256:
```python
expected_signature = hmac.new(
    settings.polar_webhook_secret.encode(),
    payload,
    hashlib.sha256
).hexdigest()
```

### Best Practices

1. **Always verify webhook signatures** before processing
2. **Use HTTPS** for webhook endpoints in production
3. **Validate all user inputs** before creating checkout sessions
4. **Log all payment events** for auditing
5. **Handle idempotency** - webhooks may be delivered multiple times

## Troubleshooting

### Checkout Not Creating

- Verify `POLAR_ACCESS_TOKEN` is correct
- Check product IDs match Polar dashboard
- Ensure CORS is configured correctly
- Check backend logs for API errors

### Webhooks Not Received

- Verify webhook URL is accessible from internet
- Check webhook secret matches configuration
- Ensure webhook events are subscribed in Polar dashboard
- Check Polar dashboard webhook logs

### Payment Success But No Subscription

- Check webhook handler logs
- Verify database permissions
- Check that plan_id in metadata is valid
- Review Polar webhook delivery logs

## Support

- Polar Documentation: https://docs.polar.sh
- Polar Support: support@polar.sh
- Application Issues: Check backend logs at `/var/log/backend.log`

## Migration from Stripe (if applicable)

If migrating from Stripe:
1. Keep both integrations running temporarily
2. Update environment variables
3. Test thoroughly with small group
4. Gradually migrate users
5. Update billing portal links

