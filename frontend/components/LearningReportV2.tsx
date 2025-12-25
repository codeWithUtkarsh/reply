'use client';

import { LearningReport } from '@/lib/api';
import CelebrationSection from './report-v2/CelebrationSection';
import QuickOverview from './report-v2/QuickOverview';
import ActionPlan from './report-v2/ActionPlan';
import StrengthsAndGrowth from './report-v2/StrengthsAndGrowth';
import { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, Tag } from 'lucide-react';
import ReactWordcloud from 'react-wordcloud';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LearningReportV2Props {
  report: LearningReport;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function LearningReportV2({ report }: LearningReportV2Props) {
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  // Transform data for celebration section
  const masteredTopics = report.weak_areas?.mastery_analysis?.mastered || [];

  // Transform data for action plan
  const actionItems = (report.weak_areas?.recommendations || []).slice(0, 3).map((rec, index) => {
    // Find the first video recommendation for this topic
    const videoRec = report.video_recommendations?.find(v =>
      v.concept.toLowerCase().includes(rec.topic.toLowerCase())
    );

    const searchQuery = videoRec?.search_queries?.[0];

    return {
      priority: (index + 1) as 1 | 2 | 3,
      topic: rec.topic,
      why: rec.reason,
      videoTitle: searchQuery?.query || `${rec.topic} Tutorial`,
      videoUrl: searchQuery?.youtube_search_url || `https://www.youtube.com/results?search_query=${rec.topic.replace(' ', '+')}`,
      estimatedTime: '20 min',
      impact: rec.priority === 'high' ? 'high' as const : 'medium' as const
    };
  });

  // Transform data for strengths and growth
  const strengths = (report.weak_areas?.mastery_analysis?.mastered || []).slice(0, 5).map(item => ({
    concept: item.concept,
    accuracy: item.accuracy,
    evidence: `You consistently answer questions correctly on this topic`
  }));

  const growthAreas = (report.weak_areas?.mastery_analysis?.learning || [])
    .concat(report.weak_areas?.mastery_analysis?.needs_review || [])
    .slice(0, 5)
    .map(item => ({
      concept: item.concept,
      accuracy: item.accuracy,
      evidence: `Practice this to strengthen your foundation`
    }));

  // Prepare performance data for detailed section
  const performanceData = [
    { name: 'Correct', value: report.performance_stats.correct_count, color: '#10b981' },
    { name: 'Incorrect', value: report.performance_stats.incorrect_count, color: '#ef4444' },
  ];

  const attemptData = [
    {
      type: 'Flashcards',
      correct: report.attempt_breakdown.flashcards.correct,
      incorrect: report.attempt_breakdown.flashcards.incorrect,
    },
    {
      type: 'Quiz',
      correct: report.attempt_breakdown.quiz.correct,
      incorrect: report.attempt_breakdown.quiz.incorrect,
    },
  ];

  const wordCloudData = Object.entries(report.word_frequency || {}).map(([text, value]) => ({
    text,
    value,
  }));

  return (
    <div className="w-full space-y-8">
      {/* 1. CELEBRATION FIRST - Start with wins! */}
      <CelebrationSection
        masteredTopics={masteredTopics}
        overallScore={report.executive_summary?.overall_score || report.performance_stats.accuracy_rate}
        totalAttempts={report.performance_stats.total_attempts}
      />

      {/* 2. QUICK OVERVIEW - Scannable in 5 seconds */}
      <QuickOverview
        score={report.executive_summary?.overall_score || report.performance_stats.accuracy_rate}
        totalQuestions={report.performance_stats.total_attempts}
        correctAnswers={report.performance_stats.correct_count}
        timeSpent={report.performance_stats.total_attempts} // Could be enhanced with actual time tracking
        topicsMastered={report.executive_summary?.topics_mastered || masteredTopics.length}
        topicsLearning={report.executive_summary?.topics_in_progress || (report.weak_areas?.mastery_analysis?.learning?.length || 0)}
        topicsFocus={report.executive_summary?.topics_to_review || (report.weak_areas?.mastery_analysis?.needs_review?.length || 0)}
      />

      {/* 3. ACTION PLAN - Max 3 specific priorities */}
      {actionItems.length > 0 && (
        <ActionPlan actions={actionItems} />
      )}

      {/* 4. STRENGTHS & GROWTH - Balanced view */}
      {(strengths.length > 0 || growthAreas.length > 0) && (
        <StrengthsAndGrowth
          strengths={strengths}
          growthAreas={growthAreas}
        />
      )}

      {/* 5. KEY INSIGHTS - AI-generated takeaways */}
      {report.key_takeaways && report.key_takeaways.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            💡 Key Insights
          </h3>
          <ul className="space-y-3">
            {report.key_takeaways.slice(0, 5).map((takeaway, index) => (
              <li
                key={index}
                className="flex gap-3 items-start"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  {index + 1}
                </span>
                <p className="text-gray-800 dark:text-gray-200 flex-1">{takeaway}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. DETAILED ANALYSIS - Collapsible for those who want it */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
          className="w-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 px-6 py-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              Detailed Performance Analysis
            </span>
          </div>
          {showDetailedAnalysis ? (
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {showDetailedAnalysis && (
          <div className="p-6 space-y-6 bg-white dark:bg-gray-800">
            {/* Performance Charts */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Performance Distribution
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Attempt Breakdown */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Performance by Type
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attemptData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" fill="#10b981" name="Correct" />
                  <Bar dataKey="incorrect" fill="#ef4444" name="Incorrect" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Content Topics */}
            {(report.video_type || report.domain || (report.main_topics && report.main_topics.length > 0)) && (
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    Content Overview
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.video_type && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                      {report.video_type}
                    </span>
                  )}
                  {report.domain && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-full text-sm font-semibold">
                      {report.domain}
                    </span>
                  )}
                  {report.main_topics?.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Word Cloud */}
            {wordCloudData.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Key Topics Covered
                </h4>
                <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-4" style={{ height: '300px' }}>
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
          </div>
        )}
      </div>

      {/* 7. ENCOURAGEMENT - End on a positive note */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-xl p-6 text-white text-center">
        <h3 className="text-2xl font-bold mb-2">
          {report.performance_stats.accuracy_rate >= 80 ? '🎉 Outstanding Work!' :
           report.performance_stats.accuracy_rate >= 60 ? '💪 You\'re Making Great Progress!' :
           '🚀 Keep Building Your Skills!'}
        </h3>
        <p className="text-white/90 text-lg">
          {report.performance_stats.accuracy_rate >= 80
            ? "You're mastering this material! Ready for the next challenge?"
            : report.performance_stats.accuracy_rate >= 60
            ? "Follow your action plan above and you'll be an expert in no time!"
            : "Every expert was once a beginner. Stay consistent and watch your progress soar!"}
        </p>
      </div>
    </div>
  );
}
