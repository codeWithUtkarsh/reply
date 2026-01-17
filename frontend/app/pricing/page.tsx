'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
        <div className="text-center mb-8">
          <h1 className="text-5xl font-light text-white mb-4">Upgrade Your Plan</h1>
          <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto">
            Unlock more credits and premium features to accelerate your learning
          </p>
        </div>

        {/* Current Subscription Info */}
        {currentSubscription && (
          <div className="mb-12 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-emerald-950/50 to-teal-950/50 border-2 border-emerald-500/40 rounded-2xl p-8 shadow-xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-xl flex items-center justify-center">
                    <Crown className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-emerald-400 text-sm font-medium mb-1">YOUR CURRENT PLAN</p>
                    <h3 className="text-white text-3xl font-light">{currentSubscription.plan?.display_name}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 font-medium text-sm">Active</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-5">
                  <p className="text-gray-400 text-sm mb-2">Video Learning Credits</p>
                  <p className="text-white text-3xl font-light">{currentSubscription.video_learning_credits_remaining} <span className="text-gray-500 text-lg">mins</span></p>
                </div>
                <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-5">
                  <p className="text-gray-400 text-sm mb-2">Notes Generation Credits</p>
                  <p className="text-white text-3xl font-light">{currentSubscription.notes_generation_credits_remaining} <span className="text-gray-500 text-lg">mins</span></p>
                </div>
              </div>

              {currentSubscription.current_period_end && (
                <div className="mt-6 pt-6 border-t border-emerald-500/20">
                  <p className="text-gray-400 text-sm">
                    Next renewal: {new Date(currentSubscription.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-950/30 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Available Plans Section Header */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <h2 className="text-3xl font-light text-white mb-3">Compare All Plans</h2>
          <p className="text-gray-400">Choose the plan that best fits your learning goals. Upgrade or downgrade anytime.</p>

          {/* New User Bonus Badge */}
          <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-full">
            <Gift className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">New users get 500 bonus credits instantly!</span>
          </div>
        </div>

        {/* Pricing Cards - 4 Column Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Free/Starter Plan */}
          <div className="relative group h-full">
            {isCurrentPlan(plans.find(p => p.name === 'free')?.id || '') && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gray-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  Current Plan
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gray-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className={`relative bg-gradient-to-br from-gray-900 to-black border ${isCurrentPlan(plans.find(p => p.name === 'free')?.id || '') ? 'border-2 border-gray-500' : 'border-gray-700'} group-hover:border-gray-600 rounded-2xl p-8 transition-all duration-300 h-full flex flex-col`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gray-500/10 border border-gray-500/30 rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-2xl font-light text-white">Starter</h3>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 min-h-[240px]">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm font-medium">75 mins video learning</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-gray-300 text-sm font-medium">300 mins AI notes</div>
                    <div className="text-gray-500 text-xs">Automated summaries</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">10% referral rewards</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">Core features</span>
                </li>
              </ul>

              <button
                onClick={() => handleSubscribe(plans.find(p => p.name === 'free')?.id || '', 'free')}
                disabled={subscribing || isCurrentPlan(plans.find(p => p.name === 'free')?.id || '')}
                className={`w-full py-3 px-6 rounded-xl font-medium transition-all mt-auto ${
                  isCurrentPlan(plans.find(p => p.name === 'free')?.id || '')
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'border border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                {isCurrentPlan(plans.find(p => p.name === 'free')?.id || '') ? 'Current Plan' : 'Start Free'}
              </button>
            </div>
          </div>

          {/* Student Plan */}
          <div className="relative group h-full">
            {!isCurrentPlan(plans.find(p => p.name === 'student')?.id || '') &&
             currentSubscription?.plan?.name === 'free' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  Recommended
                </div>
              </div>
            )}
            {isCurrentPlan(plans.find(p => p.name === 'student')?.id || '') && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  Current Plan
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl"></div>
            <div className={`relative bg-gradient-to-br from-emerald-950/80 to-black border-2 ${isCurrentPlan(plans.find(p => p.name === 'student')?.id || '') ? 'border-emerald-400' : 'border-emerald-500/40'} rounded-2xl p-8 shadow-2xl h-full flex flex-col`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-light text-white">Student</h3>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">$10</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 min-h-[240px]">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-sm font-medium">2.4x more video learning</div>
                    <div className="text-emerald-400/70 text-xs">180 mins</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-sm font-medium">3x more AI notes</div>
                    <div className="text-emerald-400/70 text-xs">900 mins generation</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">20% streak bonus saves</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">15% referral rewards</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Priority support</span>
                </li>
              </ul>

              <button
                onClick={() => handleSubscribe(plans.find(p => p.name === 'student')?.id || '', 'student')}
                disabled={subscribing || isCurrentPlan(plans.find(p => p.name === 'student')?.id || '')}
                className={`w-full py-3 px-6 rounded-xl font-medium transition-all shadow-lg mt-auto ${
                  isCurrentPlan(plans.find(p => p.name === 'student')?.id || '')
                    ? 'bg-emerald-700 text-emerald-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:from-emerald-400 hover:to-teal-400'
                }`}
              >
                {isCurrentPlan(plans.find(p => p.name === 'student')?.id || '') ? 'Current Plan' : 'Start Learning'}
              </button>
            </div>
          </div>

          {/* Professional Plan */}
          <div className="relative group h-full">
            {!isCurrentPlan(plans.find(p => p.name === 'professional')?.id || '') &&
             currentSubscription?.plan?.name === 'student' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  Recommended
                </div>
              </div>
            )}
            {isCurrentPlan(plans.find(p => p.name === 'professional')?.id || '') && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  Current Plan
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-amber-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className={`relative bg-gradient-to-br from-amber-950/50 to-black border ${isCurrentPlan(plans.find(p => p.name === 'professional')?.id || '') ? 'border-2 border-amber-400' : 'border-amber-700/50'} group-hover:border-amber-600/70 rounded-2xl p-8 transition-all duration-300 h-full flex flex-col`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-2xl font-light text-white">Pro</h3>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">$49</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 min-h-[240px]">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-sm font-medium">12x more video learning</div>
                    <div className="text-amber-400/70 text-xs">900 mins</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-sm font-medium">16x more AI notes</div>
                    <div className="text-amber-400/70 text-xs">5,000 mins generation</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">50% streak bonus saves</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Priority processing queue</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Bulk export tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">15% referral rewards</span>
                </li>
              </ul>

              <button
                onClick={() => handleSubscribe(plans.find(p => p.name === 'professional')?.id || '', 'professional')}
                disabled={subscribing || isCurrentPlan(plans.find(p => p.name === 'professional')?.id || '')}
                className={`w-full py-3 px-6 rounded-xl font-medium transition-all shadow-lg mt-auto ${
                  isCurrentPlan(plans.find(p => p.name === 'professional')?.id || '')
                    ? 'bg-amber-700 text-amber-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400'
                }`}
              >
                {isCurrentPlan(plans.find(p => p.name === 'professional')?.id || '') ? 'Current Plan' : 'Go Pro'}
              </button>
            </div>
          </div>

          {/* Pay as You Go / Flex */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-cyan-950/50 to-black border border-cyan-700/50 group-hover:border-cyan-600/70 rounded-2xl p-8 transition-all duration-300 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-light text-white">Flex</h3>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">From $5</span>
                </div>
                <p className="text-sm text-cyan-400/70 mt-1">One-time • No subscription</p>
              </div>

              <ul className="space-y-3 mb-8 min-h-[240px]">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Pay only for what you use</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-sm font-medium">Credits never expire</div>
                    <div className="text-cyan-400/70 text-xs">Use anytime, no rush</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Save up to 37% on bulk</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Mix video & notes credits</span>
                </li>
              </ul>

              <button
                onClick={() => router.push('/credits/buy')}
                className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg mt-auto"
              >
                Buy Credits
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 text-sm">
            All plans include access to our full learning platform with AI-powered features.
            <br />
            Subscriptions reset monthly. Pay as You Go credits never expire.
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
