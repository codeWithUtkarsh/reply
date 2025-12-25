'use client';

import { WeakAreas } from '@/lib/api';
import { AlertTriangle, Lightbulb, TrendingDown } from 'lucide-react';

interface WeakAreasSectionProps {
  weakAreas: WeakAreas;
}

export default function WeakAreasSection({ weakAreas }: WeakAreasSectionProps) {
  if (!weakAreas.weak_concepts || weakAreas.weak_concepts.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Fantastic Work!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No weak areas detected. You've mastered this content!
        </p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          badge: 'bg-red-500',
          text: 'text-red-700 dark:text-red-300',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          badge: 'bg-yellow-500',
          text: 'text-yellow-700 dark:text-yellow-300',
        };
      case 'low':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          badge: 'bg-blue-500',
          text: 'text-blue-700 dark:text-blue-300',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          badge: 'bg-gray-500',
          text: 'text-gray-700 dark:text-gray-300',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-orange-500" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Areas Needing Attention
        </h3>
      </div>

      {/* Weak Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {weakAreas.weak_concepts.map((concept, index) => {
          const colors = getSeverityColor(concept.severity);
          return (
            <div
              key={index}
              className={`${colors.bg} border ${colors.border} rounded-xl p-6 transition-all hover:shadow-lg`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <TrendingDown className={`w-5 h-5 ${colors.text}`} />
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    {concept.concept}
                  </h4>
                </div>
                <span className={`${colors.badge} text-white text-xs font-bold px-3 py-1 rounded-full uppercase`}>
                  {concept.severity}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {concept.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Knowledge Gaps */}
      {weakAreas.knowledge_gaps && weakAreas.knowledge_gaps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-500" />
            Identified Knowledge Gaps
          </h4>
          <div className="flex flex-wrap gap-2">
            {weakAreas.knowledge_gaps.map((gap, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 rounded-lg text-sm"
              >
                {gap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {weakAreas.recommendations && weakAreas.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
            Recommended Next Steps
          </h4>
          <div className="space-y-3">
            {weakAreas.recommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-gray-900 dark:text-white">
                    {rec.topic}
                  </h5>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    rec.priority === 'high'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : rec.priority === 'medium'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  }`}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {rec.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
