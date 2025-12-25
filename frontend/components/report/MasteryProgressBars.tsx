'use client';

import { MasteryAnalysis } from '@/lib/api';
import { CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

interface MasteryProgressBarsProps {
  mastery: MasteryAnalysis;
}

export default function MasteryProgressBars({ mastery }: MasteryProgressBarsProps) {
  if (!mastery) {
    return null;
  }

  const hasAnyProgress =
    mastery.mastered.length > 0 ||
    mastery.learning.length > 0 ||
    mastery.needs_review.length > 0;

  if (!hasAnyProgress) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Mastery Progress
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Track your learning journey across different concepts
        </p>
      </div>

      {/* Mastered Section */}
      {mastery.mastered.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              Mastered ({mastery.mastered.length})
            </h4>
          </div>
          <div className="space-y-3">
            {mastery.mastered.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                    {item.concept}
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 ml-2">
                    {item.accuracy}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${item.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Section */}
      {mastery.learning.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              Currently Learning ({mastery.learning.length})
            </h4>
          </div>
          <div className="space-y-3">
            {mastery.learning.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                    {item.concept}
                  </span>
                  <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400 ml-2">
                    {item.accuracy}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${item.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs Review Section */}
      {mastery.needs_review.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              Needs Review ({mastery.needs_review.length})
            </h4>
          </div>
          <div className="space-y-3">
            {mastery.needs_review.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                    {item.concept}
                  </span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400 ml-2">
                    {item.accuracy}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all"
                    style={{ width: `${item.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Mastered (80%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Learning (50-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Needs Review (&lt;50%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
