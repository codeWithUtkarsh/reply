'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

interface AttemptData {
  timestamp: number;
  is_correct: boolean;
  question_type: string;
}

interface StudyPatternGraphProps {
  attempts: AttemptData[];
}

export default function StudyPatternGraph({ attempts }: StudyPatternGraphProps) {
  // Process attempts data to create daily study pattern
  const processStudyData = () => {
    if (!attempts || attempts.length === 0) return [];

    // Group attempts by date
    const dailyData: { [key: string]: { total: number; correct: number; incorrect: number; date: Date } } = {};

    attempts.forEach((attempt) => {
      // Convert timestamp to date string (YYYY-MM-DD)
      const date = new Date(attempt.timestamp * 1000);
      const dateKey = date.toISOString().split('T')[0];

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          total: 0,
          correct: 0,
          incorrect: 0,
          date: date,
        };
      }

      dailyData[dateKey].total += 1;
      if (attempt.is_correct) {
        dailyData[dateKey].correct += 1;
      } else {
        dailyData[dateKey].incorrect += 1;
      }
    });

    // Convert to array and sort by date
    const sortedData = Object.entries(dailyData)
      .map(([dateKey, stats]) => ({
        date: dateKey,
        dateObj: stats.date,
        total: stats.total,
        correct: stats.correct,
        incorrect: stats.incorrect,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    // Format dates for display (e.g., "Dec 24")
    return sortedData.map((item) => ({
      ...item,
      displayDate: item.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  };

  const studyData = processStudyData();

  if (studyData.length === 0) {
    return null;
  }

  // Calculate study streak
  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = studyData.length - 1; i >= 0; i--) {
      const itemDate = new Date(studyData[i].dateObj);
      itemDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{payload[0].payload.displayDate}</p>
          <div className="space-y-1 text-sm">
            <p className="text-emerald-400">✓ Correct: {payload[0].payload.correct}</p>
            <p className="text-red-400">✗ Incorrect: {payload[0].payload.incorrect}</p>
            <p className="text-blue-400">Accuracy: {payload[0].payload.accuracy}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-light text-white">Study Pattern</h3>
            <p className="text-sm text-gray-400 font-light">Your learning activity over time</p>
          </div>
        </div>

        {/* Study Streak Badge */}
        {streak > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-xs text-gray-400">Study Streak</p>
                <p className="text-lg font-light text-orange-400">{streak} {streak === 1 ? 'day' : 'days'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={studyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="displayDate"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickLine={{ stroke: '#374151' }}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickLine={{ stroke: '#374151' }}
              label={{ value: 'Questions', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: '14px' }}>{value}</span>}
            />
            <Bar dataKey="correct" stackId="a" fill="#10b981" name="Correct" radius={[0, 0, 0, 0]} />
            <Bar dataKey="incorrect" stackId="a" fill="#ef4444" name="Incorrect" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              name="Accuracy %"
              yAxisId={0}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700">
        <div className="text-center">
          <p className="text-2xl font-light text-white">{studyData.length}</p>
          <p className="text-xs text-gray-400 font-light mt-1">Study Days</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-light text-emerald-400">
            {studyData.reduce((sum, day) => sum + day.total, 0)}
          </p>
          <p className="text-xs text-gray-400 font-light mt-1">Total Questions</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-light text-blue-400">
            {Math.round(
              studyData.reduce((sum, day) => sum + day.accuracy, 0) / studyData.length
            )}%
          </p>
          <p className="text-xs text-gray-400 font-light mt-1">Avg Accuracy</p>
        </div>
      </div>
    </div>
  );
}
