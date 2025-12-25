'use client';

import { ExecutiveSummary } from '@/lib/api';
import { Trophy, TrendingUp, Clock, Target } from 'lucide-react';

interface ExecutiveSummaryBannerProps {
  summary: ExecutiveSummary;
}

export default function ExecutiveSummaryBanner({ summary }: ExecutiveSummaryBannerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'from-emerald-500 to-green-500';
      case 'good':
        return 'from-blue-500 to-cyan-500';
      case 'needs_improvement':
        return 'from-orange-500 to-yellow-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'Excellent Performance!';
      case 'good':
        return 'Good Progress!';
      case 'needs_improvement':
        return 'Keep Practicing!';
      default:
        return 'Learning...';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    return 'text-orange-500';
  };

  return (
    <div className={`relative bg-gradient-to-r ${getStatusColor(summary.status)} rounded-2xl p-8 text-white shadow-2xl overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{getStatusText(summary.status)}</h2>
              <p className="text-white/80 mt-1">Your Learning Summary</p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-6xl font-bold ${getScoreColor(summary.overall_score)}`}>
              {summary.overall_score}%
            </div>
            <p className="text-white/80 mt-1">Overall Score</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.topics_mastered}</p>
                <p className="text-sm text-white/80">Mastered</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.topics_in_progress}</p>
                <p className="text-sm text-white/80">Learning</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500/30 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.topics_to_review}</p>
                <p className="text-sm text-white/80">To Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.time_spent}</p>
                <p className="text-sm text-white/80">Attempts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
