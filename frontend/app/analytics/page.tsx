'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Loader2, TrendingUp, Target, Award, Flame, BookOpen, Brain, Star, Trophy, Zap, ExternalLink, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface HeroStats {
  total_questions: number;
  overall_accuracy: number;
  total_videos: number;
  total_quizzes: number;
  current_streak: number;
}

interface ProgressData {
  date: string;
  questions: number;
  accuracy: number;
}

interface ProficiencyData {
  domain: string;
  proficiency: number;
  questions: number;
}

interface HeatmapData {
  date: string;
  count: number;
  day: string;
  week: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface Insight {
  type: 'strength' | 'improvement' | 'motivation';
  title: string;
  message: string;
  icon: string;
}

interface QuizReport {
  report_id: string;
  video_id: string;
  video_title: string;
  project_id: string | null;
  project_name: string | null;
  score: number;
  total_questions: number;
  correct_answers: number;
  date_taken: string;
  domain: string;
  video_type: string;
}

interface AnalyticsData {
  hero_stats: HeroStats;
  progress_data: ProgressData[];
  proficiency_data: ProficiencyData[];
  heatmap_data: HeatmapData[];
  performance_breakdown: {
    flashcards: { total: number; accuracy: number };
    quizzes: { total: number; accuracy: number };
  };
  achievements: Achievement[];
  insights: Insight[];
  quiz_reports: QuizReport[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/analytics/user/${user.id}`);
      setAnalytics(response.data);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.detail || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !analytics) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <p className="text-red-400">{error || 'No analytics data available'}</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const { hero_stats, progress_data, proficiency_data, heatmap_data, performance_breakdown, achievements, insights, quiz_reports } = analytics;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-white mb-2">Your Learning Analytics</h1>
          <p className="text-gray-400 font-light">Track your progress and celebrate your achievements</p>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-b from-purple-900/50 to-black border border-purple-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
            <div className="relative z-10">
              <BookOpen className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-3xl font-light text-white mb-1">{hero_stats.total_questions}</p>
              <p className="text-gray-400 text-sm font-light">Questions Answered</p>
            </div>
          </div>

          <div className="bg-gradient-to-b from-emerald-900/50 to-black border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
            <div className="relative z-10">
              <Target className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-3xl font-light text-white mb-1">{hero_stats.overall_accuracy}%</p>
              <p className="text-gray-400 text-sm font-light">Overall Accuracy</p>
            </div>
          </div>

          <div className="bg-gradient-to-b from-blue-900/50 to-black border border-blue-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
            <div className="relative z-10">
              <Brain className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-3xl font-light text-white mb-1">{hero_stats.total_videos}</p>
              <p className="text-gray-400 text-sm font-light">Videos Studied</p>
            </div>
          </div>

          <div className="bg-gradient-to-b from-amber-900/50 to-black border border-amber-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
            <div className="relative z-10">
              <Trophy className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-3xl font-light text-white mb-1">{hero_stats.total_quizzes}</p>
              <p className="text-gray-400 text-sm font-light">Quizzes Completed</p>
            </div>
          </div>

          <div className="bg-gradient-to-b from-orange-900/50 to-black border border-orange-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent"></div>
            <div className="relative z-10">
              <Flame className="w-8 h-8 text-orange-400 mb-2" />
              <p className="text-3xl font-light text-white mb-1">{hero_stats.current_streak}</p>
              <p className="text-gray-400 text-sm font-light">Day Streak</p>
            </div>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`border rounded-xl p-5 ${
                  insight.type === 'strength'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : insight.type === 'improvement'
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-purple-500/10 border-purple-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{insight.icon}</span>
                  <div>
                    <h3 className="text-white font-light mb-1">{insight.title}</h3>
                    <p className="text-gray-400 text-sm font-light">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Learning Progress Over Time */}
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-light text-white">Learning Progress (Last 30 Days)</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={progress_data}>
                <defs>
                  <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#accuracyGradient)"
                  name="Accuracy %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Knowledge Proficiency Radar */}
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-light text-white">Knowledge Proficiency</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={proficiency_data}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="domain" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Radar
                  name="Proficiency %"
                  dataKey="proficiency"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-light text-white">Performance Breakdown</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Flashcards */}
            <div className="border border-purple-500/30 rounded-xl p-6 bg-purple-500/10">
              <h3 className="text-lg font-light text-white mb-4">Flashcards</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Accuracy</span>
                    <span className="text-purple-400">{performance_breakdown.flashcards.accuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${performance_breakdown.flashcards.accuracy}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total Attempts</span>
                  <span className="text-white font-light">{performance_breakdown.flashcards.total}</span>
                </div>
              </div>
            </div>

            {/* Quizzes */}
            <div className="border border-emerald-500/30 rounded-xl p-6 bg-emerald-500/10">
              <h3 className="text-lg font-light text-white mb-4">Quizzes</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Accuracy</span>
                    <span className="text-emerald-400">{performance_breakdown.quizzes.accuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${performance_breakdown.quizzes.accuracy}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total Attempts</span>
                  <span className="text-white font-light">{performance_breakdown.quizzes.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Study Activity Heatmap */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-light text-white">Study Activity (Last 90 Days)</h2>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {heatmap_data.map((day, index) => {
              const intensity = day.count === 0 ? 0 : Math.min(day.count / 10, 1);
              const color = day.count === 0
                ? 'bg-gray-800'
                : intensity > 0.7
                ? 'bg-emerald-500'
                : intensity > 0.4
                ? 'bg-emerald-600'
                : 'bg-emerald-800';

              return (
                <div
                  key={index}
                  className={`aspect-square ${color} rounded-sm transition-all hover:scale-110 cursor-pointer`}
                  title={`${day.date}: ${day.count} questions`}
                ></div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
              <div className="w-3 h-3 bg-emerald-800 rounded-sm"></div>
              <div className="w-3 h-3 bg-emerald-600 rounded-sm"></div>
              <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-light text-white">Achievements Unlocked</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-gradient-to-b from-amber-900/30 to-black border border-amber-500/30 rounded-xl p-5 text-center"
                >
                  <span className="text-5xl mb-3 block">{achievement.icon}</span>
                  <h3 className="text-white font-light mb-1">{achievement.title}</h3>
                  <p className="text-gray-400 text-sm font-light">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz Reports Table */}
        {quiz_reports && quiz_reports.length > 0 && (
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-6 mt-8">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-light text-white">Quiz History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-light text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-light text-gray-400">Video</th>
                    <th className="text-left py-3 px-4 text-sm font-light text-gray-400">Project</th>
                    <th className="text-left py-3 px-4 text-sm font-light text-gray-400">Domain</th>
                    <th className="text-center py-3 px-4 text-sm font-light text-gray-400">Score</th>
                    <th className="text-center py-3 px-4 text-sm font-light text-gray-400">Questions</th>
                    <th className="text-center py-3 px-4 text-sm font-light text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quiz_reports.map((report) => {
                    const scoreColor = report.score >= 80
                      ? 'text-emerald-400'
                      : report.score >= 60
                      ? 'text-blue-400'
                      : 'text-amber-400';

                    return (
                      <tr
                        key={report.report_id}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-gray-300 font-light">
                          {new Date(report.date_taken).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-white font-light">{report.video_title}</span>
                            <span className="text-xs text-gray-500">{report.video_type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300 font-light">
                          {report.project_name || 'No Project'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full">
                            {report.domain}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-lg font-light ${scoreColor}`}>
                            {report.score}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-300 font-light">
                          {report.correct_answers}/{report.total_questions}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => router.push(`/learn/${report.video_id}`)}
                            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
