from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict
from datetime import datetime


class VideoSegment(BaseModel):
    start_time: float
    end_time: float
    text: str


class VideoTranscript(BaseModel):
    segments: List[VideoSegment]
    full_text: str
    duration: float
    detected_language: Optional[str] = None  # Language detected from transcript


class Question(BaseModel):
    id: Optional[str] = None
    question_text: str
    options: List[str]
    correct_answer: int  # Index of correct option
    explanation: str
    video_segment: VideoSegment
    difficulty: str = "medium"  # easy, medium, hard


class FlashCard(BaseModel):
    question: Question
    show_at_timestamp: float


class VideoProcessRequest(BaseModel):
    video_url: str
    title: Optional[str] = None
    project_id: Optional[str] = None
    user_id: Optional[str] = None


class VideoProcessResponse(BaseModel):
    video_id: str
    title: str
    duration: float
    transcript: VideoTranscript
    flashcards: List[FlashCard]
    message: str


class AnswerSubmission(BaseModel):
    question_id: str
    selected_answer: int
    timestamp: float


class AnswerResponse(BaseModel):
    correct: bool
    explanation: str
    video_segment: Optional[VideoSegment] = None
    redirect_timestamp: Optional[float] = None


class QuizRequest(BaseModel):
    video_id: str
    user_id: Optional[str] = None


class QuizResponse(BaseModel):
    quiz_id: str
    questions: List[Question]
    total_questions: int


class QuizSubmission(BaseModel):
    quiz_id: str
    answers: List[AnswerSubmission]


class QuizResult(BaseModel):
    quiz_id: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    details: List[Dict]
    weak_areas: List[VideoSegment]


class UserProfile(BaseModel):
    id: str
    role: str
    transcription_credits: int
    notes_credits: int
    company: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = "USD"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CreditInfo(BaseModel):
    transcription_credits: int
    notes_credits: int
    role: str
    has_unlimited: bool


# Pricing and Subscription Models

class PricingPlanFeatures(BaseModel):
    sessions_estimate: Optional[str] = None
    priority_processing: bool = False
    bulk_export: bool = False


class PricingPlan(BaseModel):
    id: str
    name: str  # free, student, professional
    display_name: str
    price_gbp: float
    billing_period: str = "monthly"

    # Credit allocations
    video_learning_credits: int
    notes_generation_credits: int

    # Streak savings
    streak_credit_save_percentage: int

    # Referral program
    referral_percentage: float
    min_withdrawal_gbp: float

    # Features
    features: PricingPlanFeatures

    # Metadata
    is_active: bool = True
    sort_order: int = 0
    description: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class Subscription(BaseModel):
    id: str
    user_id: str
    plan_id: str
    plan: Optional[PricingPlan] = None

    # Status
    status: str  # active, cancelled, expired, past_due

    # Dates
    start_date: str
    current_period_start: str
    current_period_end: Optional[str] = None
    cancelled_at: Optional[str] = None

    # Payment integration
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None

    # Credits tracking
    video_learning_credits_remaining: int
    notes_generation_credits_remaining: int
    credits_reset_at: Optional[str] = None

    # Metadata
    metadata: Optional[Dict] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class SubscriptionCreate(BaseModel):
    plan_id: str
    stripe_payment_method_id: Optional[str] = None
    referral_code: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    plan_id: Optional[str] = None
    status: Optional[str] = None


class Referral(BaseModel):
    id: str
    referrer_user_id: str
    referred_user_id: str
    referral_code: Optional[str] = None
    commission_percentage: float
    commission_amount_gbp: float
    payment_status: str  # pending, paid, withdrawn
    paid_at: Optional[str] = None
    created_at: Optional[str] = None


class ReferralStats(BaseModel):
    total_referrals: int
    total_commission_earned: float
    total_commission_pending: float
    total_commission_withdrawn: float
    min_withdrawal_amount: float
    can_withdraw: bool
    referrals: List[Referral]


# Pay as You Go Models

class CreditPackage(BaseModel):
    id: str
    name: str
    display_name: str
    video_learning_credits: int
    notes_generation_credits: int
    price_gbp: float
    description: Optional[str] = None
    is_popular: bool = False
    discount_percentage: int = 0
    badge_text: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CreditPurchase(BaseModel):
    id: str
    user_id: str
    package_id: str
    package: Optional[CreditPackage] = None
    video_learning_credits: int
    notes_generation_credits: int
    amount_gbp: float
    polar_checkout_id: Optional[str] = None
    polar_transaction_id: Optional[str] = None
    status: str  # pending, completed, failed, refunded
    completed_at: Optional[str] = None
    metadata: Optional[Dict] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CreditPurchaseCreate(BaseModel):
    package_id: str


class CreditPurchaseHistory(BaseModel):
    purchases: List[CreditPurchase]
    total_spent: float
    total_video_credits: int
    total_notes_credits: int

