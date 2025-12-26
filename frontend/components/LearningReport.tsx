'use client';

import { LearningReport } from '@/lib/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Award, TrendingUp, Brain, Target, BookOpen, Tag, Lightbulb } from 'lucide-react';
import ReactWordcloud from 'react-wordcloud';
import ExecutiveSummaryBanner from './report/ExecutiveSummaryBanner';
import WeakAreasSection from './report/WeakAreasSection';
import VideoRecommendationsSection from './report/VideoRecommendationsSection';
import MasteryProgressBars from './report/MasteryProgressBars';
import LearningPathCircuitMap from './report/LearningPathCircuitMap';

interface LearningReportProps {
  report: LearningReport;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function LearningReportComponent({ report }: LearningReportProps) {
  // Prepare word cloud data from semantic keywords
  const wordCloudData = Object.entries(report.word_frequency).map(([text, value]) => ({
    text,
    value,
  }));

  // Prepare performance data for pie chart
  const performanceData = [
    { name: 'Correct', value: report.performance_stats.correct_count, color: '#10b981' },
    { name: 'Incorrect', value: report.performance_stats.incorrect_count, color: '#ef4444' },
  ];

  // Prepare attempt breakdown data
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

  return (
    <div className="w-full space-y-8">
      {/* PRIORITY 1: Executive Summary Banner */}
      {report.executive_summary && (
        <ExecutiveSummaryBanner summary={report.executive_summary} />
      )}

      {/* PRIORITY 2: Key Takeaways (MOVED TO TOP!) */}
      {report.key_takeaways && report.key_takeaways.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Key Takeaways
            </h3>
          </div>
          <ul className="space-y-3">
            {report.key_takeaways.map((takeaway, index) => (
              <li
                key={index}
                className="p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg"
              >
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <p className="text-gray-800 dark:text-gray-200">{takeaway}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PRIORITY 3: Weak Areas & Recommendations */}
      {report.weak_areas && (
        <WeakAreasSection weakAreas={report.weak_areas} />
      )}

      {/* PRIORITY 4: Video Recommendations */}
      {report.video_recommendations && report.video_recommendations.length > 0 && (
        <VideoRecommendationsSection recommendations={report.video_recommendations} />
      )}

      {/* PRIORITY 5: Mastery Progress */}
      {report.weak_areas?.mastery_analysis && (
        <MasteryProgressBars mastery={report.weak_areas.mastery_analysis} />
      )}

      {/* PRIORITY 6: Learning Path / Circuit Map */}
      {report.learning_path && (
        <LearningPathCircuitMap learningPath={report.learning_path} />
      )}

      {/* Video Classification */}
      {(report.video_type || report.domain || (report.main_topics && report.main_topics.length > 0)) && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Content Analysis
            </h3>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            {report.video_type && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full font-semibold">
                <span className="text-sm">Type:</span>
                <span>{report.video_type}</span>
              </div>
            )}
            {report.domain && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-full font-semibold">
                <span className="text-sm">Domain:</span>
                <span>{report.domain}</span>
              </div>
            )}
          </div>

          {report.main_topics && report.main_topics.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-indigo-600" />
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Main Topics Covered:
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.main_topics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white dark:bg-gray-700 border border-indigo-300 dark:border-indigo-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRIORITY 7: Performance Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Detailed Performance Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-blue-600" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Accuracy Rate</h4>
            </div>
            <p className="text-4xl font-bold text-blue-600">
              {report.performance_stats.accuracy_rate}%
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h4 className="font-semibold text-green-900 dark:text-green-100">Total Attempts</h4>
            </div>
            <p className="text-4xl font-bold text-green-600">
              {report.performance_stats.total_attempts}
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-6 h-6 text-purple-600" />
              <h4 className="font-semibold text-purple-900 dark:text-purple-100">Correct Answers</h4>
            </div>
            <p className="text-4xl font-bold text-purple-600">
              {report.performance_stats.correct_count}/{report.performance_stats.total_attempts}
            </p>
          </div>
        </div>

        {/* Performance Pie Chart */}
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 mt-6">
          Overall Performance Distribution
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={performanceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Performance by Type
        </h3>
        <ResponsiveContainer width="100%" height={300}>
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

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Flashcards Performance
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Accuracy: <span className="font-bold">{report.attempt_breakdown.flashcards.accuracy}%</span>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {report.attempt_breakdown.flashcards.correct} correct out of{' '}
              {report.attempt_breakdown.flashcards.total}
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              Quiz Performance
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Accuracy: <span className="font-bold">{report.attempt_breakdown.quiz.accuracy}%</span>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {report.attempt_breakdown.quiz.correct} correct out of {report.attempt_breakdown.quiz.total}
            </p>
          </div>
        </div>
      </div>

      {/* Semantic Keyword Word Cloud */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Key Topics & Semantic Keywords
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          AI-extracted keywords based on semantic relevance and importance
        </p>
        <div className="w-full" style={{ height: '400px' }}>
          <ReactWordcloud
            words={wordCloudData}
            options={{
              rotations: 2,
              rotationAngles: [0, 90],
              fontSizes: [16, 80],
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 'bold',
              padding: 4,
              scale: 'sqrt',
              spiral: 'archimedean',
              transitionDuration: 1000,
              colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'],
            }}
          />
        </div>
      </div>

      {/* Key Takeaways */}
      {report.key_takeaways && report.key_takeaways.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Key Takeaways from the Video
            </h3>
          </div>
          <ul className="space-y-3">
            {report.key_takeaways.map((takeaway, index) => (
              <li
                key={index}
                className="p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg"
              >
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <p className="text-gray-800 dark:text-gray-200">{takeaway}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Encouragement Footer */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {report.performance_stats.accuracy_rate >= 80 ? '🎉 Outstanding Work!' :
           report.performance_stats.accuracy_rate >= 60 ? '💪 Great Progress!' :
           '🚀 Keep Learning!'}
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          {report.performance_stats.accuracy_rate >= 80
            ? "You've mastered this content! Consider helping others or moving on to more advanced topics."
            : report.performance_stats.accuracy_rate >= 60
            ? "You're on the right track! Focus on the weak areas and watch the recommended videos."
            : "Learning takes time. Review the recommendations above and keep practicing!"}
        </p>
      </div>
    </div>
  );
}
