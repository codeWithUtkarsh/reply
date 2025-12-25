'use client';

import { Trophy, TrendingUp, Star, Zap, CheckCircle } from 'lucide-react';

interface CelebrationProps {
  masteredTopics: Array<{ concept: string; accuracy: number }>;
  overallScore: number;
  improvement?: number; // Compared to previous
  totalAttempts: number;
  correctAnswers: number;
  growthAreas?: Array<{ concept: string; accuracy: number }>;
}

export default function CelebrationSection({
  masteredTopics,
  overallScore,
  improvement,
  totalAttempts,
  correctAnswers,
  growthAreas = []
}: CelebrationProps) {
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

          {/* Right Column - Mastered Knowledge Table */}
          {masteredTopics.length > 0 && (
            <div className="lg:col-span-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30 overflow-hidden">
              <div className="p-4 bg-emerald-500/20 border-b border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-light text-lg text-white">Knowledge Mastered</h3>
                  <span className="ml-auto bg-emerald-500/30 border border-emerald-500/40 rounded-full px-3 py-1 text-sm font-light text-emerald-300">
                    {masteredTopics.length} {masteredTopics.length === 1 ? 'area' : 'areas'}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody className="divide-y divide-emerald-500/20">
                    {masteredTopics.map((topic, index) => (
                      <tr key={index} className="hover:bg-emerald-500/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            </div>
                            <p className="font-light text-white">{topic.concept}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Growth Opportunities Section */}
        {growthAreas.length > 0 && (
          <div className="mt-6">
            <div className="bg-purple-500/10 rounded-xl border border-purple-500/30 overflow-hidden">
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
                        <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <p className="font-light text-white">{area.concept}</p>
                      </div>
                      <span className="text-purple-400 font-light text-lg ml-2">
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
                    💡 <strong className="text-white">Next Steps:</strong> Follow the action plan below to strengthen these areas, or retake the quiz to improve your score!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
