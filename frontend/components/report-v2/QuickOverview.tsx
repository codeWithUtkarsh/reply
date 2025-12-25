'use client';

import { Target, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface QuickOverviewProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in minutes
  topicsMastered: number;
  topicsLearning: number;
  topicsFocus: number;
}

export default function QuickOverview({
  score,
  totalQuestions,
  correctAnswers,
  timeSpent,
  topicsMastered,
  topicsLearning,
  topicsFocus
}: QuickOverviewProps) {
  const getTrend = () => {
    if (score >= 80) return { icon: '🎯', color: 'text-emerald-600', label: 'Excellent!' };
    if (score >= 60) return { icon: '📈', color: 'text-blue-600', label: 'Good Progress' };
    return { icon: '🚀', color: 'text-purple-600', label: 'Keep Going!' };
  };

  const trend = getTrend();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-light text-white">
          Quick Overview
        </h3>
        <div className={`flex items-center gap-2 ${trend.color} font-light`}>
          <span className="text-2xl">{trend.icon}</span>
          <span>{trend.label}</span>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Score */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-blue-500/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-light text-gray-300">Score</p>
          </div>
          <p className="text-4xl font-light text-blue-400">{score}%</p>
        </div>

        {/* Questions */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-500/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-purple-400" />
            <p className="text-sm font-light text-gray-300">Answered</p>
          </div>
          <p className="text-4xl font-light text-purple-400">{correctAnswers}/{totalQuestions}</p>
        </div>

        {/* Topics Mastered */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-emerald-500/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <p className="text-sm font-light text-gray-300">Mastered</p>
          </div>
          <p className="text-4xl font-light text-emerald-400">{topicsMastered}</p>
          <p className="text-xs text-gray-400 mt-1 font-light">topics</p>
        </div>

        {/* Learning */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-yellow-500/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <p className="text-sm font-light text-gray-300">Learning</p>
          </div>
          <p className="text-4xl font-light text-yellow-400">{topicsLearning}</p>
          <p className="text-xs text-gray-400 mt-1 font-light">topics</p>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-light text-gray-300">Learning Progress</p>
          <p className="text-sm font-light text-white">
            {topicsMastered + topicsLearning} / {topicsMastered + topicsLearning + topicsFocus} topics
          </p>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500"
              style={{ width: `${(topicsMastered / (topicsMastered + topicsLearning + topicsFocus)) * 100}%` }}
            />
            <div
              className="bg-yellow-500"
              style={{ width: `${(topicsLearning / (topicsMastered + topicsLearning + topicsFocus)) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs font-light">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-400">Mastered ({topicsMastered})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-400">Learning ({topicsLearning})</span>
          </div>
          {topicsFocus > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              <span className="text-gray-400">Focus Needed ({topicsFocus})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
