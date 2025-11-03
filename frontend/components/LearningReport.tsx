'use client';

import { LearningReport } from '@/lib/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Award, TrendingUp, Brain, Target, BookOpen } from 'lucide-react';

interface LearningReportProps {
  report: LearningReport;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function LearningReportComponent({ report }: LearningReportProps) {
  // Prepare word frequency data for chart (top 10 words)
  const wordFreqData = Object.entries(report.word_frequency)
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
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
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Award className="w-16 h-16 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Learning Report
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your comprehensive performance analysis
        </p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Accuracy Rate</h3>
          </div>
          <p className="text-4xl font-bold text-blue-600">
            {report.performance_stats.accuracy_rate}%
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-900 dark:text-green-100">Total Attempts</h3>
          </div>
          <p className="text-4xl font-bold text-green-600">
            {report.performance_stats.total_attempts}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-purple-900 dark:text-purple-100">Correct Answers</h3>
          </div>
          <p className="text-4xl font-bold text-purple-600">
            {report.performance_stats.correct_count}/{report.performance_stats.total_attempts}
          </p>
        </div>
      </div>

      {/* Performance Pie Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Overall Performance
        </h3>
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

      {/* Word Frequency */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Key Topics (Word Frequency)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={wordFreqData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="word" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
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

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Great Work!
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          {report.performance_stats.accuracy_rate >= 70
            ? "Excellent performance! You've demonstrated a strong understanding of the material."
            : "Keep practicing! Review the key takeaways and weak areas to improve your understanding."}
        </p>
      </div>
    </div>
  );
}
