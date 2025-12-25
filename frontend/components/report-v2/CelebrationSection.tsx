'use client';

import { Trophy, TrendingUp, Star, Zap } from 'lucide-react';

interface CelebrationProps {
  masteredTopics: Array<{ concept: string; accuracy: number }>;
  overallScore: number;
  improvement?: number; // Compared to previous
  totalAttempts: number;
}

export default function CelebrationSection({
  masteredTopics,
  overallScore,
  improvement,
  totalAttempts
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

        {/* Wins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Overall Achievement */}
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-emerald-400" />
              <h3 className="font-light text-lg text-white">Great Score!</h3>
            </div>
            <p className="text-4xl font-light text-emerald-400 mb-1">{overallScore}%</p>
            <p className="text-gray-400 text-sm font-light">Overall Performance</p>
          </div>

          {/* Mastered Knowledge - Show all as individual strength cards */}
          {masteredTopics.map((topic, index) => (
            <div
              key={index}
              className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <h3 className="font-light text-white">Mastered!</h3>
              </div>
              <p className="font-light text-white mb-1 line-clamp-2">{topic.concept}</p>
              <p className="text-gray-400 text-sm font-light">{topic.accuracy}% accuracy</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
