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
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quick Overview
        </h3>
        <div className={`flex items-center gap-2 ${trend.color} font-semibold`}>
          <span className="text-2xl">{trend.icon}</span>
          <span>{trend.label}</span>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Score */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Score</p>
          </div>
          <p className="text-4xl font-bold text-blue-600">{score}%</p>
        </div>

        {/* Questions */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Answered</p>
          </div>
          <p className="text-4xl font-bold text-purple-600">{correctAnswers}/{totalQuestions}</p>
        </div>

        {/* Topics Mastered */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Mastered</p>
          </div>
          <p className="text-4xl font-bold text-emerald-600">{topicsMastered}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">topics</p>
        </div>

        {/* Learning */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Learning</p>
          </div>
          <p className="text-4xl font-bold text-orange-600">{topicsLearning}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">topics</p>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Learning Progress</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {topicsMastered + topicsLearning} / {topicsMastered + topicsLearning + topicsFocus} topics
          </p>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
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
        <div className="flex items-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Mastered ({topicsMastered})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Learning ({topicsLearning})</span>
          </div>
          {topicsFocus > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Focus Needed ({topicsFocus})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
