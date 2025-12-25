'use client';

import { Target, Play, ExternalLink, Clock, Lightbulb } from 'lucide-react';

interface ActionItem {
  priority: 1 | 2 | 3;
  topic: string;
  why: string; // Why this matters
  videoTitle: string;
  videoUrl: string;
  estimatedTime: string;
  impact: 'high' | 'medium';
}

interface ActionPlanProps {
  actions: ActionItem[];
}

export default function ActionPlan({ actions }: ActionPlanProps) {
  if (!actions || actions.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          You're All Set!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No action items right now. Keep practicing to maintain your mastery!
        </p>
      </div>
    );
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return {
      bg: 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20',
      border: 'border-red-200 dark:border-red-800',
      badge: 'bg-red-500',
      text: 'text-red-700 dark:text-red-300'
    };
    if (priority === 2) return {
      bg: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      badge: 'bg-blue-500',
      text: 'text-blue-700 dark:text-blue-300'
    };
    return {
      bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      badge: 'bg-purple-500',
      text: 'text-purple-700 dark:text-purple-300'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-7 h-7 text-emerald-600" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your Action Plan
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Focus on these {actions.length} priorities to maximize your learning
        </p>
      </div>

      {/* Action Items */}
      <div className="space-y-4">
        {actions.slice(0, 3).map((action) => {
          const colors = getPriorityColor(action.priority);

          return (
            <div
              key={action.priority}
              className={`bg-gradient-to-r ${colors.bg} border-2 ${colors.border} rounded-xl p-6 transition-all hover:shadow-lg`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`${colors.badge} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0`}>
                    {action.priority}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {action.topic}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Lightbulb className="w-4 h-4" />
                      <span>{action.why}</span>
                    </div>
                  </div>
                </div>
                {action.impact === 'high' && (
                  <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold px-3 py-1 rounded-full">
                    HIGH IMPACT
                  </span>
                )}
              </div>

              {/* Video Recommendation */}
              <a
                href={action.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <Play className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">
                        {action.videoTitle}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{action.estimatedTime}</span>
                        </div>
                        <span className="text-xs text-gray-500">Recommended for you</span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                </div>
              </a>

              {/* Quick Action */}
              <div className="mt-4 bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Next Step:</strong> Watch the video, then practice 3-5 problems to reinforce your understanding.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated Total Time */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          ⏱️ <strong>Total estimated time:</strong> {
            actions.slice(0, 3).reduce((total, action) => {
              const mins = parseInt(action.estimatedTime);
              return total + (isNaN(mins) ? 20 : mins);
            }, 0)
          } minutes · Complete these to unlock the next level! 🚀
        </p>
      </div>
    </div>
  );
}
