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
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              Your Strengths
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              What you're excelling at
            </p>
          </div>
        </div>

        {strengths && strengths.length > 0 ? (
          <div className="space-y-3">
            {strengths.map((strength, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {strength.concept}
                      </p>
                      {strength.evidence && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {strength.evidence}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-emerald-600 font-bold text-lg ml-2">
                    {strength.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              Keep practicing to build your strengths!
            </p>
          </div>
        )}
      </div>

      {/* Growth Opportunities */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              Growth Opportunities
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Areas to strengthen
            </p>
          </div>
        </div>

        {growthAreas && growthAreas.length > 0 ? (
          <div className="space-y-3">
            {growthAreas.map((area, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {area.concept}
                      </p>
                      {area.evidence && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {area.evidence}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-blue-600 font-bold text-lg ml-2">
                    {area.accuracy}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                      style={{ width: `${area.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              You're doing great! No major growth areas identified.
            </p>
          </div>
        )}

        {growthAreas && growthAreas.length > 0 && (
          <div className="mt-4 bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              💡 <strong>Pro tip:</strong> Focus on your action plan above to turn these into strengths!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
