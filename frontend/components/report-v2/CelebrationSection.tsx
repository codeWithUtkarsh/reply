'use client';

import { Trophy, TrendingUp, Star, Zap, CheckCircle, Target, Play, ExternalLink, Clock, Lightbulb, Tag } from 'lucide-react';
import ReactWordcloud from 'react-wordcloud';
import StudyPatternGraph from './StudyPatternGraph';

interface ActionItem {
  priority: 1 | 2 | 3;
  topic: string;
  why: string;
  videoTitle: string;
  videoUrl: string;
  estimatedTime: string;
  impact: 'high' | 'medium';
}

interface AttemptData {
  timestamp: number;
  is_correct: boolean;
  question_type: string;
}

interface CelebrationProps {
  masteredTopics: Array<{ concept: string; accuracy: number }>;
  overallScore: number;
  improvement?: number; // Compared to previous
  totalAttempts: number;
  correctAnswers: number;
  growthAreas?: Array<{ concept: string; accuracy: number }>;
  actionItems?: ActionItem[];
  wordCloudData?: Array<{ text: string; value: number }>;
  attemptsData?: AttemptData[];
}

export default function CelebrationSection({
  masteredTopics,
  overallScore,
  improvement,
  totalAttempts,
  correctAnswers,
  growthAreas = [],
  actionItems = [],
  wordCloudData = [],
  attemptsData = []
}: CelebrationProps) {
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
  const hasWins = masteredTopics.length > 0 || overallScore >= 70;

  if (!hasWins) {
    return (
      <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-500/30 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center">
            <Zap className="w-10 h-10 text-purple-400" />
          </div>
          <div>
            <h2 className="text-3xl font-light text-white">You're Building Momentum!</h2>
            <p className="text-gray-400 font-light mt-1">Every expert was once a beginner. Keep going!</p>
          </div>
        </div>
        <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
          <p className="text-lg font-light text-gray-300">
            You completed {totalAttempts} questions. That's {totalAttempts} steps forward! 🚀
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black border border-emerald-500/30 rounded-2xl p-8 shadow-xl shadow-emerald-500/10 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-purple-500/5"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center animate-pulse">
              <Trophy className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-3xl font-light text-white">Celebrate Your Wins! 🎉</h2>
              <p className="text-gray-400 font-light mt-1">You're making real progress</p>
            </div>
          </div>

          {improvement !== undefined && improvement > 0 && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="font-light text-white">+{improvement}% from last time!</span>
            </div>
          )}
        </div>

        {/* Key Topics Covered - Word Cloud */}
        {wordCloudData.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-light text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-gray-400" />
              Key Topics Covered
            </h3>
            <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4" style={{ height: '300px' }}>
              <ReactWordcloud
                words={wordCloudData}
                options={{
                  rotations: 2,
                  rotationAngles: [0, 90],
                  fontSizes: [14, 60],
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 'bold',
                  padding: 3,
                  scale: 'sqrt',
                  spiral: 'archimedean',
                  transitionDuration: 1000,
                  colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'],
                }}
              />
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Score Cards */}
          <div className="space-y-4">
            {/* Overall Achievement Card */}
            <div className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-emerald-400" />
                <h3 className="font-light text-lg text-white">Great Score!</h3>
              </div>
              <p className="text-4xl font-light text-emerald-400 mb-1">{overallScore}%</p>
              <p className="text-gray-400 text-sm font-light">Overall Performance</p>
            </div>

            {/* Answered Card */}
            <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                <h3 className="font-light text-lg text-white">Answered</h3>
              </div>
              <p className="text-4xl font-light text-purple-400 mb-1">
                {correctAnswers}/{totalAttempts}
              </p>
              <p className="text-gray-400 text-sm font-light">Questions Completed</p>
            </div>
          </div>

          {/* Right Column - Growth Opportunities */}
          {growthAreas.length > 0 && (
            <div className="lg:col-span-2 bg-purple-500/10 rounded-xl border border-purple-500/30 overflow-hidden">
              <div className="p-4 bg-purple-500/20 border-b border-purple-500/30">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h3 className="font-light text-lg text-white">Growth Opportunities</h3>
                  <span className="ml-auto bg-purple-500/30 border border-purple-500/40 rounded-full px-3 py-1 text-sm font-light text-purple-300">
                    {growthAreas.length} {growthAreas.length === 1 ? 'area' : 'areas'}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {growthAreas.map((area, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 border border-purple-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        <TrendingUp className="w-4 h-4 text-purple-400 flex-shrink-0 mt-1" />
                        <p className="font-light text-white text-sm break-words">{area.concept}</p>
                      </div>
                      <span className="text-purple-400 font-light text-sm ml-2 whitespace-nowrap">
                        {area.accuracy}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all"
                          style={{ width: `${area.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Action Message */}
                <div className="mt-4 bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-sm text-gray-300 font-light">
                    💡 <strong className="text-white">Next Steps:</strong> Check the action plan below to strengthen these areas, or retake the quiz to improve your score!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Plan Section */}
        {actionItems.length > 0 && (
          <div className="mt-6">
            <div className="bg-gradient-to-b from-gray-900 to-black border border-blue-500/30 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 bg-blue-500/20 border-b border-blue-500/30">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  <h3 className="font-light text-lg text-white">Your Action Plan</h3>
                  <span className="ml-auto bg-blue-500/30 border border-blue-500/40 rounded-full px-3 py-1 text-sm font-light text-blue-300">
                    {actionItems.length} {actionItems.length === 1 ? 'priority' : 'priorities'}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {actionItems.slice(0, 3).map((action) => {
                  const colors = getPriorityColor(action.priority);

                  return (
                    <div
                      key={action.priority}
                      className={`bg-gradient-to-b ${colors.bg} border ${colors.border} rounded-lg p-4`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`${colors.badge} text-white rounded-full w-7 h-7 flex items-center justify-center font-light flex-shrink-0 text-sm`}>
                            {action.priority}
                          </div>
                          <div>
                            <h4 className="text-lg font-light text-white mb-1">
                              {action.topic}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-400 font-light">
                              <Lightbulb className="w-4 h-4" />
                              <span>{action.why}</span>
                            </div>
                          </div>
                        </div>
                        {action.impact === 'high' && (
                          <span className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-light px-2 py-1 rounded-full">
                            HIGH IMPACT
                          </span>
                        )}
                      </div>

                      {/* Video Recommendation */}
                      <a
                        href={action.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:shadow-md hover:border-gray-600 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center">
                              <Play className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                              <p className="font-light text-white text-sm group-hover:text-emerald-400 transition-colors">
                                {action.videoTitle}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1 text-xs text-gray-400 font-light">
                                  <Clock className="w-3 h-3" />
                                  <span>{action.estimatedTime}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </a>
                    </div>
                  );
                })}

                {/* Total Time */}
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                  <p className="text-sm text-blue-300 font-light">
                    ⏱️ <strong className="text-white">Total estimated time:</strong> {
                      actionItems.slice(0, 3).reduce((total, action) => {
                        const mins = parseInt(action.estimatedTime);
                        return total + (isNaN(mins) ? 20 : mins);
                      }, 0)
                    } minutes · Complete these to unlock the next level! 🚀
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Study Pattern Graph */}
        {attemptsData.length > 0 && (
          <div className="mt-6">
            <StudyPatternGraph attempts={attemptsData} />
          </div>
        )}
      </div>
    </div>
  );
}
