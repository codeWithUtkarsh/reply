'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Zap, TrendingUp, Sparkles, Crown, Check, Loader2, ArrowRight } from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  display_name: string;
  video_learning_credits: number;
  notes_generation_credits: number;
  price_gbp: number;
  description: string;
  is_popular: boolean;
  discount_percentage: number;
  badge_text: string | null;
  sort_order: number;
}

export default function BuyCreditsPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customPurchasing, setCustomPurchasing] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/credit-packages`
      );
      const data = await response.json();
      setPackages(data);
    } catch (err) {
      console.error('Failed to fetch credit packages:', err);
      setError('Failed to load credit packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      alert('Please sign in to purchase credits');
      return;
    }

    setPurchasing(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/credits/purchase/create?package_id=${packageId}&user_id=${user.id}&user_email=${user.email || ''}`,
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
    } catch (err) {
      console.error('Failed to purchase:', err);
      alert('Failed to start purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleCustomPurchase = async () => {
    if (!user) {
      alert('Please sign in to purchase credits');
      return;
    }

    const amount = parseFloat(customAmount);
    if (!amount || amount < 1) {
      alert('Please enter a valid amount (minimum £1)');
      return;
    }

    if (amount > 1000) {
      alert('Maximum amount is £1,000 per transaction');
      return;
    }

    setCustomPurchasing(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/credits/purchase/custom?amount_gbp=${amount}&user_id=${user.id}&user_email=${user.email || ''}`,
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
    } catch (err) {
      console.error('Failed to purchase:', err);
      alert('Failed to start purchase. Please try again.');
    } finally {
      setCustomPurchasing(false);
    }
  };

  const getPackageIcon = (packageName: string) => {
    switch (packageName) {
      case 'starter':
        return <Zap className="w-8 h-8" />;
      case 'popular':
        return <TrendingUp className="w-8 h-8" />;
      case 'power':
        return <Sparkles className="w-8 h-8" />;
      case 'mega':
        return <Crown className="w-8 h-8" />;
      default:
        return <Zap className="w-8 h-8" />;
    }
  };

  const getPackageColor = (packageName: string, isPopular: boolean) => {
    if (isPopular) {
      return {
        bg: 'bg-gradient-to-br from-emerald-950 to-gray-900',
        border: 'border-emerald-700',
        accent: 'text-emerald-400',
        button: 'bg-emerald-600 hover:bg-emerald-500',
      };
    }

    switch (packageName) {
      case 'mega':
        return {
          bg: 'bg-gradient-to-br from-purple-950 to-gray-900',
          border: 'border-purple-700',
          accent: 'text-purple-400',
          button: 'bg-purple-600 hover:bg-purple-500',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-900 to-black',
          border: 'border-gray-800',
          accent: 'text-gray-400',
          button: 'bg-gray-700 hover:bg-gray-600',
        };
    }
  };

  if (!user) {
    return null;
  }

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
          <h1 className="text-5xl font-light text-white mb-4">Buy Credits</h1>
          <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto">
            Purchase credits on-demand. No subscription required. Credits never expire.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-950/30 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Credit Packages */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
          {packages.map((pkg) => {
            const colors = getPackageColor(pkg.name, pkg.is_popular);
            const icon = getPackageIcon(pkg.name);

            return (
              <div
                key={pkg.id}
                className={`relative ${
                  pkg.is_popular ? 'md:scale-105' : ''
                } transition-all hover:scale-105`}
              >
                {/* Popular/Badge */}
                {(pkg.is_popular || pkg.badge_text) && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className={`${pkg.is_popular ? 'bg-emerald-500' : 'bg-purple-600'} text-white px-4 py-1 rounded-full text-sm font-medium`}>
                      {pkg.badge_text || 'Most Popular'}
                    </div>
                  </div>
                )}

                <div
                  className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-6 relative h-full flex flex-col`}
                >
                  {/* Icon */}
                  <div className={`${colors.accent} mb-4`}>{icon}</div>

                  {/* Package Name */}
                  <h3 className="text-2xl font-semibold text-white mb-2">{pkg.display_name}</h3>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">£{pkg.price_gbp}</span>
                      {pkg.discount_percentage > 0 && (
                        <span className="text-emerald-400 text-sm font-medium">
                          Save {pkg.discount_percentage}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-6">{pkg.description}</p>

                  {/* Credits */}
                  <div className="space-y-3 mb-6 flex-grow">
                    <div className="flex items-center gap-3">
                      <Check className={`w-5 h-5 ${colors.accent} flex-shrink-0`} />
                      <span className="text-gray-300 text-sm">
                        {pkg.video_learning_credits} mins video learning
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className={`w-5 h-5 ${colors.accent} flex-shrink-0`} />
                      <span className="text-gray-300 text-sm">
                        {pkg.notes_generation_credits} mins notes generation
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className={`w-5 h-5 ${colors.accent} flex-shrink-0`} />
                      <span className="text-gray-300 text-sm">Credits never expire</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className={`w-5 h-5 ${colors.accent} flex-shrink-0`} />
                      <span className="text-gray-300 text-sm">No subscription required</span>
                    </div>
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasing}
                    className={`w-full py-3 px-6 rounded-xl font-medium text-white transition-all ${colors.button} shadow-lg flex items-center justify-center gap-2`}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Buy Now
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-light text-white mb-4 text-center">
            Why Pay as You Go?
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl mb-2">💳</div>
              <h4 className="text-white font-medium mb-2">No Commitment</h4>
              <p className="text-gray-400 text-sm">
                Buy only what you need, when you need it
              </p>
            </div>
            <div>
              <div className="text-4xl mb-2">♾️</div>
              <h4 className="text-white font-medium mb-2">Never Expires</h4>
              <p className="text-gray-400 text-sm">
                Your credits stay with you until you use them
              </p>
            </div>
            <div>
              <div className="text-4xl mb-2">💰</div>
              <h4 className="text-white font-medium mb-2">Better Value</h4>
              <p className="text-gray-400 text-sm">
                Larger packs offer better savings per credit
              </p>
            </div>
          </div>
        </div>

        {/* FAQ or Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Need a subscription instead?{' '}
            <a href="/pricing" className="text-emerald-400 hover:text-emerald-300 underline">
              View subscription plans
            </a>
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
