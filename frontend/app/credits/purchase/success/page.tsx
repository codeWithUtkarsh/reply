'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { CheckCircle2, Loader2, XCircle, ArrowRight, Sparkles } from 'lucide-react';

interface CreditPurchase {
  id: string;
  package_name: string;
  video_learning_credits: number;
  notes_generation_credits: number;
  amount_gbp: number;
  purchase_date: string;
}

export default function CreditPurchaseSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'processing' | 'error'>('loading');
  const [purchase, setPurchase] = useState<CreditPurchase | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setStatus('error');
      setError('No session ID provided');
      return;
    }

    verifyPurchase(sessionId);
  }, [searchParams]);

  const verifyPurchase = async (sessionId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/credits/purchase/success?session_id=${sessionId}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'success') {
          setStatus('success');
          setPurchase(data.purchase);
        } else if (data.status === 'processing') {
          setStatus('processing');
          // Retry after a short delay
          setTimeout(() => verifyPurchase(sessionId), 3000);
        } else {
          setStatus('error');
          setError('Purchase verification failed');
        }
      } else {
        setStatus('error');
        setError('Failed to verify purchase');
      }
    } catch (err) {
      console.error('Failed to verify purchase:', err);
      setStatus('error');
      setError('An error occurred while verifying your purchase');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-8 py-16">
        <div className="max-w-2xl mx-auto">
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-light text-white mb-2">Verifying your purchase...</h2>
              <p className="text-gray-400">Please wait while we confirm your credit purchase</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-light text-white mb-2">Processing your purchase...</h2>
              <p className="text-gray-400">
                Your payment is being processed. This usually takes just a few seconds.
              </p>
            </div>
          )}

          {status === 'success' && purchase && (
            <div className="bg-gradient-to-b from-emerald-950/50 to-gray-900/50 border border-emerald-500/30 rounded-2xl p-8 md:p-12">
              {/* Success Icon */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <h1 className="text-3xl md:text-4xl font-light text-white mb-3">
                  Credits Added Successfully!
                </h1>
                <p className="text-gray-300 text-lg">
                  Your {purchase.package_name} package has been activated
                </p>
              </div>

              {/* Purchase Details */}
              <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-medium">Your New Credits</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Package</span>
                    <span className="text-white font-medium">{purchase.package_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Video Learning Credits</span>
                    <span className="text-emerald-400 font-medium">
                      +{purchase.video_learning_credits} mins
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Notes Generation Credits</span>
                    <span className="text-emerald-400 font-medium">
                      +{purchase.notes_generation_credits} mins
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <span className="text-gray-400">Amount Paid</span>
                    <span className="text-white font-medium">${purchase.amount_gbp.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <div className="text-blue-400 text-2xl">ℹ️</div>
                  <div>
                    <h4 className="text-blue-300 font-medium mb-1">Credits Never Expire</h4>
                    <p className="text-blue-200/80 text-sm">
                      Your credits will remain in your account until you use them. No time limits, no stress.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/projects')}
                  className="w-full py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Start Learning
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/credits/buy')}
                  className="w-full py-3 px-6 border border-emerald-700/50 hover:bg-emerald-900/30 text-emerald-300 rounded-xl transition-all"
                >
                  Buy More Credits
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t border-emerald-500/20">
                <p className="text-gray-400 text-sm text-center">
                  A confirmation email has been sent to your inbox.
                  <br />
                  You can view your purchase history anytime from the Buy Credits page.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-gradient-to-b from-red-950/50 to-gray-900/50 border border-red-500/30 rounded-2xl p-8 md:p-12">
              {/* Error Icon */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-3xl md:text-4xl font-light text-white mb-3">
                  Purchase Verification Failed
                </h1>
                <p className="text-gray-300 text-lg mb-6">
                  {error || "We couldn't verify your purchase"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/credits/buy')}
                  className="w-full py-3 px-6 bg-red-500 hover:bg-red-400 text-white font-medium rounded-xl transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/projects')}
                  className="w-full py-3 px-6 border border-gray-700 hover:bg-gray-800/50 text-gray-300 rounded-xl transition-all"
                >
                  Go to Dashboard
                </button>
              </div>

              {/* Support Info */}
              <div className="mt-6 pt-6 border-t border-red-500/20">
                <p className="text-gray-400 text-sm text-center">
                  If you believe this is an error or if you were charged, please contact support.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
