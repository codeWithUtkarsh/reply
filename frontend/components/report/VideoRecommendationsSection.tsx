'use client';

import { VideoRecommendation } from '@/lib/api';
import { Youtube, ExternalLink, Play } from 'lucide-react';

interface VideoRecommendationsSectionProps {
  recommendations: VideoRecommendation[];
}

export default function VideoRecommendationsSection({ recommendations }: VideoRecommendationsSectionProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Youtube className="w-6 h-6 text-red-500" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Recommended Videos to Watch
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        Based on your weak areas, we've curated these YouTube videos to help you strengthen your understanding.
      </p>

      {/* Recommendations */}
      <div className="grid grid-cols-1 gap-6">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all"
          >
            {/* Concept Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Play className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {rec.concept}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {rec.why_helpful}
                </p>
              </div>
            </div>

            {/* Search Queries */}
            <div className="space-y-3">
              {rec.search_queries.map((query, queryIndex) => (
                <a
                  key={queryIndex}
                  href={query.youtube_search_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Youtube className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {query.query}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {query.video_type}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Helper Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Pro Tip:</strong> Watch these videos in order of priority. Take notes and try to apply what you learn!
        </p>
      </div>
    </div>
  );
}
