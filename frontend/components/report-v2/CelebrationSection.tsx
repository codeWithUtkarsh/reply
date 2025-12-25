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
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Zap className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">You're Building Momentum!</h2>
            <p className="text-white/90 mt-1">Every expert was once a beginner. Keep going!</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <p className="text-lg">
            You completed {totalAttempts} questions. That's {totalAttempts} steps forward! 🚀
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-pulse">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Celebrate Your Wins! 🎉</h2>
              <p className="text-white/90 mt-1">You're making real progress</p>
            </div>
          </div>

          {improvement !== undefined && improvement > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-bold">+{improvement}% from last time!</span>
            </div>
          )}
        </div>

        {/* Wins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Overall Achievement */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5" />
              <h3 className="font-bold text-lg">Great Score!</h3>
            </div>
            <p className="text-4xl font-bold mb-1">{overallScore}%</p>
            <p className="text-white/80 text-sm">Overall Performance</p>
          </div>

          {/* Mastered Topics */}
          {masteredTopics.slice(0, 2).map((topic, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5" />
                <h3 className="font-bold">Mastered!</h3>
              </div>
              <p className="font-semibold mb-1 line-clamp-2">{topic.concept}</p>
              <p className="text-white/80 text-sm">{topic.accuracy}% accuracy</p>
            </div>
          ))}

          {/* More achievements */}
          {masteredTopics.length > 2 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold mb-1">+{masteredTopics.length - 2}</p>
                <p className="text-white/80 text-sm">More concepts mastered!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
