'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { usersApi, CreditHistoryEntry } from '@/lib/api';
import { Loader2, TrendingDown, TrendingUp, Video, FileText, Calendar, Info } from 'lucide-react';

export default function CreditsPage() {
  const { user, refreshUserProfile } = useAuth();
  const [history, setHistory] = useState<CreditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchCreditHistory();
      // Refresh user profile to get latest credits
      refreshUserProfile();
    }
  }, [user]);

  const fetchCreditHistory = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getCreditHistory(user!.id);
      setHistory(response.history);
    } catch (err: any) {
      console.error('Failed to fetch credit history:', err);
      setError('Failed to load credit history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'deduct':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'add':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'refund':
        return <TrendingUp className="w-5 h-5 text-blue-400" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCreditTypeIcon = (type: string) => {
    return type === 'transcription' ? (
      <Video className="w-4 h-4" />
    ) : (
      <FileText className="w-4 h-4" />
    );
  };

  const getCreditTypeBadgeColor = (type: string) => {
    return type === 'transcription'
      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
      : 'bg-blue-500/10 border-blue-500/30 text-blue-400';
  };

  if (!user) {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-white mb-2">Credit History</h1>
          <p className="text-gray-400 font-light">
            Track your credit consumption across video transcription and notes generation
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-light text-white mb-3">No credit history yet</h3>
            <p className="text-gray-400 font-light">
              Start processing videos or generating notes to see your credit usage here
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-800/50 border-b border-gray-700 text-sm font-medium text-gray-400">
              <div className="col-span-3">Date & Time</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-1 text-center">Amount</div>
              <div className="col-span-1 text-center">Before</div>
              <div className="col-span-1 text-center">After</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-800">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-800/30 transition-colors"
                >
                  {/* Date */}
                  <div className="col-span-3 flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{formatDate(entry.created_at)}</span>
                  </div>

                  {/* Type Badge */}
                  <div className="col-span-1 flex items-center">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs ${getCreditTypeBadgeColor(
                        entry.credit_type
                      )}`}
                    >
                      {getCreditTypeIcon(entry.credit_type)}
                      <span className="capitalize">{entry.credit_type.slice(0, 5)}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-span-4 flex flex-col">
                    <span className="text-white text-sm">
                      {entry.video_title || entry.description || 'Credit transaction'}
                    </span>
                    {entry.project_name && (
                      <span className="text-xs text-gray-500 mt-1">
                        Project: {entry.project_name}
                      </span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="col-span-1 text-center">
                    <span className={`font-medium ${entry.operation === 'deduct' ? 'text-red-400' : 'text-green-400'}`}>
                      {entry.operation === 'deduct' ? '-' : '+'}{entry.amount}
                    </span>
                  </div>

                  {/* Balance Before */}
                  <div className="col-span-1 text-center">
                    <span className="text-gray-400">{entry.balance_before}</span>
                  </div>

                  {/* Balance After */}
                  <div className="col-span-1 text-center">
                    <span className="text-white font-medium">{entry.balance_after}</span>
                  </div>

                  {/* Operation Icon */}
                  <div className="col-span-1 flex justify-center items-center">
                    {getOperationIcon(entry.operation)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
