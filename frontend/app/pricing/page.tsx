'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Check, Zap, Crown, Gift, Loader2, TrendingUp } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  display_name: string;
  price_gbp: number;
  billing_period: string;
  video_learning_credits: number;
  notes_generation_credits: number;
  streak_credit_save_percentage: number;
  referral_percentage: number;
  min_withdrawal_gbp: number;
  features: {
    sessions_estimate?: string;
    priority_processing: boolean;
    bulk_export: boolean;
  };
  description: string;
  sort_order: number;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  plan?: PricingPlan;
  video_learning_credits_remaining: number;
  notes_generation_credits_remaining: number;
  current_period_end?: string;
}

export default function PricingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchPricingPlans();
    if (user) {
      fetchCurrentSubscription();
    }
  }, [user]);

  const fetchPricingPlans = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/plans`);
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      console.error('Failed to fetch pricing plans:', err);
      setError('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/subscription/${user?.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data);
      }
    } catch (err) {
      // No active subscription or error - that's okay
      console.log('No active subscription found');
    }
  };

  const handleSubscribe = async (planId: string, planName: string) => {
    if (!user) {
      alert('Please sign in to subscribe');
      return;
    }

    setSubscribing(true);
    try {
      // For free plan, create subscription directly
      if (planName.toLowerCase() === 'free') {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/subscription/${user.id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              plan_id: planId,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setCurrentSubscription(data);
          alert('Subscription successful! Your credits have been updated.');
          fetchCurrentSubscription();
        } else {
          const errorData = await response.json();
          alert(`Subscription failed: ${errorData.detail || 'Unknown error'}`);
        }
      } else {
        // For paid plans, redirect to Polar checkout
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/checkout/create?plan_id=${planId}&user_id=${user.id}&user_email=${user.email || ''}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Redirect to Polar checkout
          if (data.checkout_url) {
            window.location.href = data.checkout_url;
          } else {
            alert('Failed to create checkout session');
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to create checkout: ${errorData.detail || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free':
        return <Gift className="w-8 h-8" />;
      case 'student':
        return <Zap className="w-8 h-8" />;
      case 'professional':
        return <Crown className="w-8 h-8" />;
      default:
        return <Zap className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'free':
        return {
          bg: 'bg-gradient-to-br from-gray-800 to-gray-900',
          border: 'border-gray-700',
          accent: 'text-gray-400',
          button: 'bg-gray-700 hover:bg-gray-600',
        };
      case 'student':
        return {
          bg: 'bg-gradient-to-br from-emerald-950 to-gray-900',
          border: 'border-emerald-700',
          accent: 'text-emerald-400',
          button: 'bg-emerald-600 hover:bg-emerald-500',
        };
      case 'professional':
        return {
          bg: 'bg-gradient-to-br from-purple-950 to-gray-900',
          border: 'border-purple-700',
          accent: 'text-purple-400',
          button: 'bg-purple-600 hover:bg-purple-500',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-800 to-gray-900',
          border: 'border-gray-700',
          accent: 'text-gray-400',
          button: 'bg-gray-700 hover:bg-gray-600',
        };
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId;
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-white mb-4">Choose Your Plan</h1>
          <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto">
            Unlock powerful learning features with flexible pricing plans designed for students and
            professionals
          </p>
        </div>

        {/* Current Subscription Info */}
        {currentSubscription && (
          <div className="mb-8 bg-gradient-to-r from-emerald-950/50 to-purple-950/50 border border-emerald-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-lg font-medium mb-1">Current Plan: {currentSubscription.plan?.display_name}</h3>
                <p className="text-gray-400 text-sm">
                  Video Credits: {currentSubscription.video_learning_credits_remaining} mins |
                  Notes Credits: {currentSubscription.notes_generation_credits_remaining} mins
                </p>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-950/30 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const colors = getPlanColor(plan.name);
            const icon = getPlanIcon(plan.name);
            const isCurrent = isCurrentPlan(plan.id);

            return (
              <div
                key={plan.id}
                className={`${colors.bg} ${colors.border} border-2 rounded-3xl p-8 relative transition-all hover:scale-105 ${
                  plan.name === 'professional' ? 'md:scale-105 shadow-2xl shadow-purple-500/20' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.name === 'professional' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className={`${colors.accent} mb-4`}>
                  {icon}
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-semibold text-white mb-2">{plan.display_name}</h3>

                {/* Price */}
                <div className="mb-6">
                  {plan.price_gbp === 0 ? (
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-white">Free</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-white">£{plan.price_gbp}</span>
                      <span className="text-gray-400 ml-2">/month</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-6 min-h-[40px]">{plan.description}</p>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className={`w-5 h-5 ${colors.accent} mt-0.5 flex-shrink-0`} />
                    <span className="text-gray-300 text-sm">
                      {plan.video_learning_credits} mins video learning credits
                      {plan.features.sessions_estimate && (
                        <span className="text-gray-500"> ({plan.features.sessions_estimate})</span>
                      )}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className={`w-5 h-5 ${colors.accent} mt-0.5 flex-shrink-0`} />
                    <span className="text-gray-300 text-sm">
                      {plan.notes_generation_credits} mins notes generation
                    </span>
                  </li>
                  {plan.streak_credit_save_percentage > 0 && (
                    <li className="flex items-start gap-3">
                      <Check className={`w-5 h-5 ${colors.accent} mt-0.5 flex-shrink-0`} />
                      <span className="text-gray-300 text-sm">
                        Save {plan.streak_credit_save_percentage}% of credits for maintaining streak
                      </span>
                    </li>
                  )}
                  {plan.features.priority_processing && (
                    <li className="flex items-start gap-3">
                      <Check className={`w-5 h-5 ${colors.accent} mt-0.5 flex-shrink-0`} />
                      <span className="text-gray-300 text-sm">Priority processing</span>
                    </li>
                  )}
                  {plan.features.bulk_export && (
                    <li className="flex items-start gap-3">
                      <Check className={`w-5 h-5 ${colors.accent} mt-0.5 flex-shrink-0`} />
                      <span className="text-gray-300 text-sm">Bulk export features</span>
                    </li>
                  )}
                  <li className="flex items-start gap-3">
                    <Check className={`w-5 h-5 ${colors.accent} mt-0.5 flex-shrink-0`} />
                    <span className="text-gray-300 text-sm">
                      Referral program: {plan.referral_percentage}% commission
                    </span>
                  </li>
                  {plan.min_withdrawal_gbp > 0 && (
                    <li className="flex items-start gap-3">
                      <Check className={`w-5 h-5 ${colors.accent} mt-0.5 flex-shrink-0`} />
                      <span className="text-gray-300 text-sm">
                        Min withdrawal: £{plan.min_withdrawal_gbp}
                      </span>
                    </li>
                  )}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.id, plan.name)}
                  disabled={subscribing || isCurrent}
                  className={`w-full py-3 px-6 rounded-xl font-medium text-white transition-all ${
                    isCurrent
                      ? 'bg-gray-700 cursor-not-allowed opacity-50'
                      : `${colors.button} shadow-lg`
                  }`}
                >
                  {subscribing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : plan.price_gbp === 0 ? (
                    'Get Started'
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 text-sm">
            All plans include access to our full learning platform with AI-powered features.
            <br />
            Credits reset monthly. No hidden fees or long-term commitments.
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
