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
      <div className="bg-gradient-to-b from-gray-900 to-black border border-emerald-500/30 rounded-xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-light text-white mb-2">
          You're All Set!
        </h3>
        <p className="text-gray-400 font-light">
          No action items right now. Keep practicing to maintain your mastery!
        </p>
      </div>
    );
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return {
      bg: 'from-gray-900 to-black',
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500',
      text: 'text-emerald-400'
    };
    if (priority === 2) return {
      bg: 'from-gray-900 to-black',
      border: 'border-purple-500/30',
      badge: 'bg-purple-500',
      text: 'text-purple-400'
    };
    return {
      bg: 'from-gray-900 to-black',
      border: 'border-blue-500/30',
      badge: 'bg-blue-500',
      text: 'text-blue-400'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-7 h-7 text-emerald-400" />
          <h3 className="text-2xl font-light text-white">
            Your Action Plan
          </h3>
        </div>
        <p className="text-gray-400 font-light">
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
              className={`bg-gradient-to-b ${colors.bg} border ${colors.border} rounded-xl p-6 transition-all hover:shadow-xl shadow-lg`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`${colors.badge} text-white rounded-full w-8 h-8 flex items-center justify-center font-light flex-shrink-0`}>
                    {action.priority}
                  </div>
                  <div>
                    <h4 className="text-xl font-light text-white mb-1">
                      {action.topic}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-400 font-light">
                      <Lightbulb className="w-4 h-4" />
                      <span>{action.why}</span>
                    </div>
                  </div>
                </div>
                {action.impact === 'high' && (
                  <span className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-light px-3 py-1 rounded-full">
                    HIGH IMPACT
                  </span>
                )}
              </div>

              {/* Video Recommendation */}
              <a
                href={action.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-gray-600 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center">
                      <Play className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="font-light text-white group-hover:text-emerald-400 transition-colors">
                        {action.videoTitle}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-400 font-light">
                          <Clock className="w-3 h-3" />
                          <span>{action.estimatedTime}</span>
                        </div>
                        <span className="text-xs text-gray-500 font-light">Recommended for you</span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                </div>
              </a>

              {/* Quick Action */}
              <div className="mt-4 bg-gray-800/30 rounded-lg p-3">
                <p className="text-sm text-gray-300 font-light">
                  <strong className="text-white">Next Step:</strong> Watch the video, then practice 3-5 problems to reinforce your understanding.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated Total Time */}
      <div className="bg-gradient-to-b from-gray-900 to-black border border-blue-500/30 rounded-lg p-4 shadow-lg">
        <p className="text-sm text-blue-300 font-light">
          ⏱️ <strong className="text-white">Total estimated time:</strong> {
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
