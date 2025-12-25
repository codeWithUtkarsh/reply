'use client';

import { LearningPath } from '@/lib/api';
import { CheckCircle, Circle, Lock, ArrowRight, Lightbulb } from 'lucide-react';

interface LearningPathCircuitMapProps {
  learningPath: LearningPath;
}

export default function LearningPathCircuitMap({ learningPath }: LearningPathCircuitMapProps) {
  if (!learningPath || (!learningPath.learning_path?.length && !learningPath.next_steps?.length)) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'mastered':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'in_progress':
      case 'learning':
        return <Circle className="w-6 h-6 text-yellow-500" />;
      case 'not_started':
      case 'locked':
        return <Lock className="w-6 h-6 text-gray-400" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'mastered':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          border: 'border-emerald-500',
          text: 'text-emerald-700 dark:text-emerald-300',
        };
      case 'in_progress':
      case 'learning':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          border: 'border-yellow-500',
          text: 'text-yellow-700 dark:text-yellow-300',
        };
      case 'not_started':
      case 'locked':
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          border: 'border-gray-400',
          text: 'text-gray-600 dark:text-gray-400',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          border: 'border-gray-400',
          text: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your Learning Journey
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Visual roadmap of your progress and next steps
        </p>
      </div>

      {/* Learning Path Timeline */}
      {learningPath.learning_path && learningPath.learning_path.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Learning Path Progress
          </h4>

          <div className="space-y-4">
            {learningPath.learning_path.map((step, index) => {
              const colors = getStatusColor(step.status);
              const isLast = index === learningPath.learning_path.length - 1;

              return (
                <div key={index} className="relative">
                  {/* Connection Line */}
                  {!isLast && (
                    <div className="absolute left-7 top-14 w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
                  )}

                  {/* Step Card */}
                  <div className={`${colors.bg} border-2 ${colors.border} rounded-xl p-4 transition-all hover:shadow-lg`}>
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(step.status)}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                            Step {step.step}
                          </span>
                          <h5 className={`text-lg font-bold ${colors.text}`}>
                            {step.topic}
                          </h5>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {step.description}
                        </p>
                        {step.estimated_time && (
                          <span className="inline-block px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                            ⏱️ {step.estimated_time}
                          </span>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className={`flex-shrink-0 px-3 py-1 ${colors.bg} border ${colors.border} rounded-full text-xs font-bold ${colors.text} uppercase`}>
                        {step.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Circuit Map Visualization */}
      {learningPath.circuit_map && learningPath.circuit_map.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Knowledge Circuit Map
          </h4>

          <div className="flex flex-wrap gap-4 justify-center">
            {learningPath.circuit_map.map((node, index) => {
              const colors = getStatusColor(node.status);
              const hasConnections = node.connections && node.connections.length > 0;

              return (
                <div key={node.id} className="relative">
                  {/* Node */}
                  <div
                    className={`${colors.bg} border-2 ${colors.border} rounded-xl p-4 min-w-[150px] text-center transition-all hover:scale-105 hover:shadow-lg`}
                  >
                    <div className="flex justify-center mb-2">
                      {getStatusIcon(node.status)}
                    </div>
                    <p className={`font-bold text-sm ${colors.text}`}>
                      {node.label}
                    </p>
                  </div>

                  {/* Connection Arrows */}
                  {hasConnections && index < learningPath.circuit_map.length - 1 && (
                    <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-indigo-200 dark:border-indigo-800">
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-700 dark:text-gray-300">Mastered</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-700 dark:text-gray-300">Learning</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Locked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {learningPath.next_steps && learningPath.next_steps.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              Recommended Next Steps
            </h4>
          </div>

          <div className="space-y-4">
            {learningPath.next_steps.map((step, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {step.priority}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-900 dark:text-white mb-1">
                      {step.topic}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {step.reason}
                    </p>
                    {step.prerequisites && step.prerequisites.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Prerequisites:
                        </span>
                        {step.prerequisites.map((prereq, prereqIndex) => (
                          <span
                            key={prereqIndex}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-700 dark:text-gray-300"
                          >
                            {prereq}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
