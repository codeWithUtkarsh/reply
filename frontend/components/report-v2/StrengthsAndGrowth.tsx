'use client';

import { Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';

interface ConceptDetail {
  concept: string;
  accuracy: number;
  evidence?: string; // Why we think this is a strength/growth area
}

interface StrengthsAndGrowthProps {
  strengths: ConceptDetail[];
  growthAreas: ConceptDetail[];
}

export default function StrengthsAndGrowth({ strengths, growthAreas }: StrengthsAndGrowthProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Strengths */}
      <div className="bg-gradient-to-b from-gray-900 to-black border border-emerald-500/30 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xl font-light text-white">
              Your Strengths
            </h4>
            <p className="text-sm text-gray-400 font-light">
              What you're excelling at
            </p>
          </div>
        </div>

        {strengths && strengths.length > 0 ? (
          <div className="space-y-3">
            {strengths.map((strength, index) => (
              <div
                key={index}
                className="bg-gray-800/50 border border-emerald-700/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="font-light text-white">
                      {strength.concept}
                    </p>
                  </div>
                  <span className="text-emerald-400 font-light text-lg ml-2">
                    {strength.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 font-light">
              Keep practicing to build your strengths!
            </p>
          </div>
        )}
      </div>

      {/* Growth Opportunities */}
      <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-500/30 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h4 className="text-xl font-light text-white">
              Growth Opportunities
            </h4>
            <p className="text-sm text-gray-400 font-light">
              Areas to strengthen
            </p>
          </div>
        </div>

        {growthAreas && growthAreas.length > 0 ? (
          <div className="space-y-3">
            {growthAreas.map((area, index) => (
              <div
                key={index}
                className="bg-gray-800/50 border border-purple-700/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-light text-white">
                        {area.concept}
                      </p>
                      {area.evidence && (
                        <p className="text-sm text-gray-400 font-light mt-1">
                          {area.evidence}
                        </p>
                      )}
                    </div>
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
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 font-light">
              You're doing great! No major growth areas identified.
            </p>
          </div>
        )}

        {growthAreas && growthAreas.length > 0 && (
          <div className="mt-4 bg-gray-800/30 rounded-lg p-3">
            <p className="text-sm text-gray-300 font-light">
              💡 <strong className="text-white">Pro tip:</strong> Focus on your action plan above to turn these into strengths!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
