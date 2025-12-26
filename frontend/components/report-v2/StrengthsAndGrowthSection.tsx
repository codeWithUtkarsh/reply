'use client';

import React from 'react';
import { Trophy, TrendingUp, Target } from 'lucide-react';

interface TopicItem {
  concept: string;
  accuracy: number;
  evidence: string;
}

interface StrengthsAndGrowthSectionProps {
  strengths: TopicItem[];
  growthAreas: TopicItem[];
}

export default function StrengthsAndGrowthSection({ strengths, growthAreas }: StrengthsAndGrowthSectionProps) {
  if (strengths.length === 0 && growthAreas.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 border-b border-gray-700">
        <h3 className="text-xl font-light text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          Strengths & Growth Opportunities
        </h3>
        <p className="text-sm text-gray-400 font-light mt-1">
          Understanding where you excel and where to focus next
        </p>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-light text-white">Your Strengths</h4>
                <p className="text-xs text-gray-400">Areas where you excel</p>
              </div>
            </div>

            {strengths.length > 0 ? (
              <div className="space-y-3">
                {strengths.map((item, index) => (
                  <div
                    key={index}
                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-light text-white text-sm flex-1 pr-2">
                        {item.concept}
                      </h5>
                      <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full px-2 py-1 text-xs font-light whitespace-nowrap">
                        {item.accuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${item.accuracy}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 font-light">{item.evidence}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-800/30 border border-gray-700 rounded-lg">
                <p className="text-gray-400 text-sm font-light">
                  Keep practicing to build your strengths!
                </p>
              </div>
            )}
          </div>

          {/* Growth Areas Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-light text-white">Growth Opportunities</h4>
                <p className="text-xs text-gray-400">Areas to strengthen</p>
              </div>
            </div>

            {growthAreas.length > 0 ? (
              <div className="space-y-3">
                {growthAreas.map((item, index) => (
                  <div
                    key={index}
                    className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-light text-white text-sm flex-1 pr-2">
                        {item.concept}
                      </h5>
                      <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full px-2 py-1 text-xs font-light whitespace-nowrap">
                        {item.accuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${item.accuracy}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 font-light">{item.evidence}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-800/30 border border-gray-700 rounded-lg">
                <p className="text-gray-400 text-sm font-light">
                  Great job! You're doing well across all areas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-light text-emerald-400">{strengths.length}</p>
            <p className="text-xs text-gray-400 font-light mt-1">Strong Areas</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light text-purple-400">{growthAreas.length}</p>
            <p className="text-xs text-gray-400 font-light mt-1">Growth Areas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
