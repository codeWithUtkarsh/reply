"""
Polar Payment Service
Handles integration with Polar.sh for subscription payments
"""

import httpx
from typing import Dict, Optional
from config import settings
from logging_config import get_logger

logger = get_logger(__name__)


class PolarService:
    """Service for interacting with Polar.sh API"""

    def __init__(self):
        self.base_url = "https://api.polar.sh/v1"
        self.access_token = settings.polar_access_token
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    async def create_checkout_session(
        self,
        product_id: str,
        customer_email: Optional[str] = None,
        customer_name: Optional[str] = None,
        success_url: Optional[str] = None,
        metadata: Optional[Dict] = None,
        is_subscription: bool = True,
        allow_discount_codes: bool = False,
    ) -> Dict:
        """
        Create a Polar checkout session

        Args:
            product_id: The Polar product ID for the subscription or one-time product
            customer_email: Customer's email address
            customer_name: Customer's name
            success_url: URL to redirect after successful payment
            metadata: Additional metadata to attach to the checkout
            is_subscription: Whether this is a subscription or one-time purchase
            allow_discount_codes: Whether to allow customers to enter discount codes at checkout

        Returns:
            Dict containing checkout session data including URL
        """
        try:
            payload = {
                "product_id": product_id,
                    "allow_discount_codes": True,
            }

            if customer_email:
                payload["customer_email"] = customer_email

            if customer_name:
                payload["customer_name"] = customer_name

            if success_url:
                payload["success_url"] = success_url

            if metadata:
                payload["metadata"] = metadata

            # For one-time purchases, set subscription to false
            if not is_subscription:
                payload["is_subscription"] = False

            # Enable discount codes if requested
            if allow_discount_codes:
                payload["allow_discount_codes"] = True

            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.post(
                    f"{self.base_url}/checkouts",
                    json=payload,
                    headers=self.headers,
                    timeout=30.0,
                )

                response.raise_for_status()
                return response.json()

        except httpx.HTTPError as e:
            logger.error(f"Failed to create Polar checkout session: {str(e)}")
            raise Exception(f"Polar API error: {str(e)}")

    async def get_checkout_session(self, checkout_id: str) -> Dict:
        """
        Get checkout session details

        Args:
            checkout_id: The checkout session ID

        Returns:
            Dict containing checkout session data
        """
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(
                    f"{self.base_url}/checkouts/{checkout_id}",
                    headers=self.headers,
                    timeout=30.0,
                )

                response.raise_for_status()
                return response.json()

        except httpx.HTTPError as e:
            logger.error(f"Failed to get Polar checkout session: {str(e)}")
            raise Exception(f"Polar API error: {str(e)}")

    async def verify_webhook_signature(
        self, payload: bytes, signature: str
    ) -> bool:
        """
        Verify Polar webhook signature

        Args:
            payload: Raw webhook payload
            signature: Webhook signature from headers

        Returns:
            Boolean indicating if signature is valid
        """
        # Polar webhook signature verification
        # Implementation depends on Polar's webhook signature method
        # Usually HMAC-SHA256 with webhook secret
        import hmac
        import hashlib

        expected_signature = hmac.new(
            settings.polar_webhook_secret.encode(),
            payload,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)

    async def handle_webhook_event(self, event_data: Dict) -> None:
        """
        Process Polar webhook events

        Args:
            event_data: Webhook event payload
        """
        event_type = event_data.get("type")
        logger.info(f"Processing Polar webhook event: {event_type}")

        if event_type == "checkout.completed":
            await self._handle_checkout_completed(event_data)
        elif event_type == "subscription.created":
            await self._handle_subscription_created(event_data)
        elif event_type == "subscription.updated":
            await self._handle_subscription_updated(event_data)
        elif event_type == "subscription.cancelled":
            await self._handle_subscription_cancelled(event_data)
        else:
            logger.warning(f"Unhandled Polar webhook event type: {event_type}")

    async def _handle_checkout_completed(self, event_data: Dict) -> None:
        """Handle successful checkout completion"""
        logger.info(f"Checkout completed: {event_data}")
        # This will be implemented in the subscriptions route
        pass

    async def _handle_subscription_created(self, event_data: Dict) -> None:
        """Handle subscription creation"""
        logger.info(f"Subscription created: {event_data}")
        pass

    async def _handle_subscription_updated(self, event_data: Dict) -> None:
        """Handle subscription update"""
        logger.info(f"Subscription updated: {event_data}")
        pass

    async def _handle_subscription_cancelled(self, event_data: Dict) -> None:
        """Handle subscription cancellation"""
        logger.info(f"Subscription cancelled: {event_data}")
        pass

    def get_product_id_for_plan(self, plan_name: str) -> Optional[str]:
        """
        Get Polar product ID for a pricing plan

        Args:
            plan_name: Name of the pricing plan (student, professional)

        Returns:
            Polar product ID or None for free plan
        """
        product_map = {
            "student": settings.polar_student_product_id,
            "professional": settings.polar_professional_product_id,
        }

        return product_map.get(plan_name.lower())


# Global instance
polar_service = PolarService()
