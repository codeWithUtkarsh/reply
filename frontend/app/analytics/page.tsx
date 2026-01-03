'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Loader2, TrendingUp, Target, Flame, BookOpen, Brain, Star, Trophy, ExternalLink, FileText, Sparkles } from 'lucide-react';
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
  video_id: string;
  video_title: string;
  project_id: string | null;
  project_name: string | null;
  attempts_count: number;
  mean_score: number;
  latest_date: string;
  domain: string;
  video_type: string;
  flashcard_count: number;
  quiz_question_count: number;
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
  const [activeBreakdown, setActiveBreakdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Map icon names to Lucide icon components
  const getInsightIcon = (iconName: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      trophy: <Trophy className="w-8 h-8" />,
      target: <Target className="w-8 h-8" />,
      flame: <Flame className="w-8 h-8" />,
      sparkles: <Sparkles className="w-8 h-8" />
    };
    return iconMap[iconName] || <Star className="w-8 h-8" />;
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-white mb-2">Your Learning Analytics</h1>
          <p className="text-gray-400 font-light">Track your progress and celebrate your achievements</p>
        </div>

        {/* Hero Stats - Now Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setActiveBreakdown('questions')}
            className="bg-gradient-to-b from-purple-900/50 to-black border border-purple-500/30 hover:border-purple-400/50 rounded-xl p-6 relative overflow-hidden transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent group-hover:from-purple-500/20"></div>
            <div className="relative z-10">
              <BookOpen className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-3xl font-light text-white mb-1">{hero_stats.total_questions}</p>
              <p className="text-gray-400 text-sm font-light">Questions Answered</p>
              <p className="text-purple-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click for breakdown →</p>
            </div>
          </button>

          <button
            onClick={() => setActiveBreakdown('accuracy')}
            className="bg-gradient-to-b from-emerald-900/50 to-black border border-emerald-500/30 hover:border-emerald-400/50 rounded-xl p-6 relative overflow-hidden transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent group-hover:from-emerald-500/20"></div>
            <div className="relative z-10">
              <Target className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-3xl font-light text-white mb-1">{hero_stats.overall_accuracy}%</p>
              <p className="text-gray-400 text-sm font-light">Overall Accuracy</p>
              <p className="text-emerald-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click for breakdown →</p>
            </div>
          </button>

          <button
            onClick={() => setActiveBreakdown('videos')}
            className="bg-gradient-to-b from-blue-900/50 to-black border border-blue-500/30 hover:border-blue-400/50 rounded-xl p-6 relative overflow-hidden transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20"></div>
            <div className="relative z-10">
              <Brain className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-3xl font-light text-white mb-1">{hero_stats.total_videos}</p>
              <p className="text-gray-400 text-sm font-light">Videos Studied</p>
              <p className="text-blue-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click for breakdown →</p>
            </div>
          </button>

          <button
            onClick={() => setActiveBreakdown('quizzes')}
            className="bg-gradient-to-b from-amber-900/50 to-black border border-amber-500/30 hover:border-amber-400/50 rounded-xl p-6 relative overflow-hidden transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent group-hover:from-amber-500/20"></div>
            <div className="relative z-10">
              <Trophy className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-3xl font-light text-white mb-1">{hero_stats.total_quizzes}</p>
              <p className="text-gray-400 text-sm font-light">Quizzes Completed</p>
              <p className="text-amber-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click for breakdown →</p>
            </div>
          </button>

          <button
            onClick={() => setActiveBreakdown('streak')}
            className="bg-gradient-to-b from-orange-900/50 to-black border border-orange-500/30 hover:border-orange-400/50 rounded-xl p-6 relative overflow-hidden transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent group-hover:from-orange-500/20"></div>
            <div className="relative z-10">
              <Flame className="w-8 h-8 text-orange-400 mb-2" />
              <p className="text-3xl font-light text-white mb-1">{hero_stats.current_streak}</p>
              <p className="text-gray-400 text-sm font-light">Day Streak</p>
              <p className="text-orange-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click for breakdown →</p>
            </div>
          </button>
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
                  <div className={
                    insight.type === 'strength'
                      ? 'text-emerald-400'
                      : insight.type === 'improvement'
                      ? 'text-blue-400'
                      : 'text-purple-400'
                  }>
                    {getInsightIcon(insight.icon)}
                  </div>
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

        {/* Quiz Reports Table */}
        {quiz_reports && quiz_reports.length > 0 && (
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-6 mb-8">
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
                    <th className="text-center py-3 px-4 text-sm font-light text-gray-400">Attempts</th>
                    <th className="text-center py-3 px-4 text-sm font-light text-gray-400">Avg Score</th>
                    <th className="text-center py-3 px-4 text-sm font-light text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quiz_reports.map((report) => {
                    const scoreColor = report.mean_score >= 80
                      ? 'text-emerald-400'
                      : report.mean_score >= 60
                      ? 'text-blue-400'
                      : 'text-amber-400';

                    return (
                      <tr
                        key={report.video_id}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-gray-300 font-light">
                          {new Date(report.latest_date).toLocaleDateString('en-US', {
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
                          <span className="text-sm text-gray-300 font-light">
                            {report.attempts_count}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-lg font-light ${scoreColor}`}>
                            {report.mean_score}%
                          </span>
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

        {/* Study Activity Heatmap */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-light text-white">Study Activity (Last 90 Days)</h2>
          </div>
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
          >
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

        {/* Breakdown Modal */}
        {activeBreakdown && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => { setActiveBreakdown(null); setCurrentPage(1); }}>
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-light text-white">
                  {activeBreakdown === 'questions' && '📚 Questions Answered Breakdown'}
                  {activeBreakdown === 'accuracy' && '🎯 Accuracy Breakdown'}
                  {activeBreakdown === 'videos' && '🎬 Videos Studied Breakdown'}
                  {activeBreakdown === 'quizzes' && '🏆 Quizzes Completed Breakdown'}
                  {activeBreakdown === 'streak' && '🔥 Streak Details'}
                </h2>
                <button
                  onClick={() => { setActiveBreakdown(null); setCurrentPage(1); }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <div className="p-6">
                {/* Questions Breakdown */}
                {activeBreakdown === 'questions' && (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
                        <BookOpen className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-3xl font-light text-white mb-1">{performance_breakdown.flashcards.total}</p>
                        <p className="text-gray-400 text-xs font-light">Flashcard Questions</p>
                        <p className="text-purple-300 text-xs mt-1">{performance_breakdown.flashcards.accuracy}% accuracy</p>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                        <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                        <p className="text-3xl font-light text-white mb-1">{performance_breakdown.quizzes.total}</p>
                        <p className="text-gray-400 text-xs font-light">Quiz Questions</p>
                        <p className="text-amber-300 text-xs mt-1">{performance_breakdown.quizzes.accuracy}% accuracy</p>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                        <Target className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-3xl font-light text-white mb-1">{hero_stats.overall_accuracy}%</p>
                        <p className="text-gray-400 text-xs font-light">Overall Accuracy</p>
                        <p className="text-emerald-300 text-xs mt-1">{hero_stats.total_questions} total questions</p>
                      </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-800/50">
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-3 px-4 text-xs font-light text-gray-400 uppercase tracking-wider">Project</th>
                              <th className="text-left py-3 px-4 text-xs font-light text-gray-400 uppercase tracking-wider">Video</th>
                              <th className="text-center py-3 px-4 text-xs font-light text-gray-400 uppercase tracking-wider">Flashcards</th>
                              <th className="text-center py-3 px-4 text-xs font-light text-gray-400 uppercase tracking-wider">Quiz Questions</th>
                              <th className="text-center py-3 px-4 text-xs font-light text-gray-400 uppercase tracking-wider">Quiz Attempts</th>
                              <th className="text-center py-3 px-4 text-xs font-light text-gray-400 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quiz_reports.length > 0 ? (
                              (() => {
                                const startIndex = (currentPage - 1) * itemsPerPage;
                                const endIndex = startIndex + itemsPerPage;
                                const paginatedReports = quiz_reports.slice(startIndex, endIndex);

                                return paginatedReports.map((report, index) => (
                                  <tr
                                    key={report.video_id}
                                    className={`border-b border-gray-800/50 hover:bg-gray-700/30 transition-colors ${
                                      index === paginatedReports.length - 1 ? 'border-0' : ''
                                    }`}
                                  >
                                    <td className="py-3 px-4">
                                      <span className="text-sm text-gray-300 font-light">
                                        {report.project_name || <span className="text-gray-500">No Project</span>}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex flex-col">
                                        <span className="text-sm text-white font-light">{report.video_title}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full">
                                            {report.domain}
                                          </span>
                                          <span className="text-xs text-gray-500">{report.video_type}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="text-sm text-purple-300 font-light">
                                        {report.flashcard_count || 0}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="text-sm text-amber-300 font-light">
                                        {report.quiz_question_count || 0}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="text-sm text-gray-300 font-light">
                                        {report.attempts_count}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="text-sm text-white font-semibold">
                                        {(report.flashcard_count || 0) + (report.quiz_question_count || 0)}
                                      </span>
                                    </td>
                                  </tr>
                                ));
                              })()
                            ) : (
                              <tr>
                                <td colSpan={6} className="py-12 text-center">
                                  <p className="text-gray-400 font-light">No videos studied yet</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {quiz_reports.length > itemsPerPage && (
                        <div className="border-t border-gray-700 bg-gray-800/30 px-4 py-3 flex items-center justify-between">
                          <div className="text-sm text-gray-400 font-light">
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, quiz_reports.length)} to{' '}
                            {Math.min(currentPage * itemsPerPage, quiz_reports.length)} of {quiz_reports.length} videos
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-400 font-light">
                              Page {currentPage} of {Math.ceil(quiz_reports.length / itemsPerPage)}
                            </span>
                            <button
                              onClick={() => setCurrentPage(Math.min(Math.ceil(quiz_reports.length / itemsPerPage), currentPage + 1))}
                              disabled={currentPage === Math.ceil(quiz_reports.length / itemsPerPage)}
                              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Accuracy Breakdown */}
                {activeBreakdown === 'accuracy' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                        <Target className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                        <p className="text-4xl font-light text-white mb-2">{performance_breakdown.flashcards.accuracy}%</p>
                        <p className="text-gray-400 text-sm font-light">Flashcard Accuracy</p>
                        <p className="text-gray-500 text-xs mt-2">{performance_breakdown.flashcards.total} questions</p>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                        <Trophy className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                        <p className="text-4xl font-light text-white mb-2">{performance_breakdown.quizzes.accuracy}%</p>
                        <p className="text-gray-400 text-sm font-light">Quiz Accuracy</p>
                        <p className="text-gray-500 text-xs mt-2">{performance_breakdown.quizzes.total} questions</p>
                      </div>
                    </div>

                    <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                      <h3 className="text-lg font-light text-white mb-4">By Domain</h3>
                      <div className="space-y-3">
                        {proficiency_data.map((domain) => (
                          <div key={domain.domain} className="flex items-center justify-between">
                            <span className="text-white text-sm font-light">{domain.domain}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${domain.proficiency}%` }}
                                ></div>
                              </div>
                              <span className="text-emerald-400 text-sm font-light w-12 text-right">{domain.proficiency}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Videos Breakdown */}
                {activeBreakdown === 'videos' && (
                  <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 text-center mb-6">
                      <Brain className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                      <p className="text-5xl font-light text-white mb-2">{hero_stats.total_videos}</p>
                      <p className="text-gray-400 font-light">Total Videos Studied</p>
                    </div>

                    {quiz_reports.length > 0 ? (
                      <div className="space-y-3">
                        {quiz_reports.map((report) => (
                          <div key={report.video_id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-blue-500/30 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-white font-light mb-1">{report.video_title}</h4>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  {report.project_name && (
                                    <span className="flex items-center gap-1">
                                      📁 {report.project_name}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    🏷️ {report.domain}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    🎬 {report.video_type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-sm">
                                  <span className="text-gray-400">{report.attempts_count} attempts</span>
                                  <span className={`${report.mean_score >= 80 ? 'text-emerald-400' : report.mean_score >= 60 ? 'text-blue-400' : 'text-amber-400'}`}>
                                    {report.mean_score}% avg score
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => router.push(`/learn/${report.video_id}`)}
                                className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center gap-1"
                              >
                                View
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-400 font-light">No videos studied yet. Start learning now!</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quizzes Breakdown */}
                {activeBreakdown === 'quizzes' && (
                  <div className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center mb-6">
                      <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3" />
                      <p className="text-5xl font-light text-white mb-2">{hero_stats.total_quizzes}</p>
                      <p className="text-gray-400 font-light">Total Quizzes Completed</p>
                    </div>

                    {quiz_reports.length > 0 ? (
                      <div className="space-y-3">
                        {quiz_reports.map((report) => (
                          <div key={report.video_id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-amber-500/30 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-white font-light mb-1">{report.video_title}</h4>
                                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                                  <span>📅 {new Date(report.latest_date).toLocaleDateString()}</span>
                                  {report.project_name && <span>📁 {report.project_name}</span>}
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">{report.attempts_count}</span>
                                    <span className="text-gray-500 text-xs">attempts</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-lg font-light ${report.mean_score >= 80 ? 'text-emerald-400' : report.mean_score >= 60 ? 'text-blue-400' : 'text-amber-400'}`}>
                                      {report.mean_score}%
                                    </span>
                                    <span className="text-gray-500 text-xs">avg score</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => router.push(`/learn/${report.video_id}`)}
                                className="text-amber-400 hover:text-amber-300 transition-colors text-sm flex items-center gap-1"
                              >
                                Retake
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-400 font-light">No quizzes completed yet. Complete some flashcards to unlock quizzes!</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Streak Breakdown */}
                {activeBreakdown === 'streak' && (
                  <div className="space-y-6">
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 text-center">
                      <Flame className="w-16 h-16 text-orange-400 mx-auto mb-3" />
                      <p className="text-5xl font-light text-white mb-2">{hero_stats.current_streak}</p>
                      <p className="text-gray-400 font-light">Day{hero_stats.current_streak !== 1 ? 's' : ''} Streak</p>
                      {hero_stats.current_streak > 0 && (
                        <p className="text-orange-300 text-sm mt-3">Keep it up! Study today to maintain your streak 🔥</p>
                      )}
                    </div>

                    <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                      <h3 className="text-lg font-light text-white mb-4">Recent Activity</h3>
                      <div className="grid grid-cols-7 gap-2">
                        {heatmap_data.slice(-14).map((day, index) => {
                          const intensity = day.count === 0 ? 0 : Math.min(day.count / 10, 1);
                          const color = day.count === 0
                            ? 'bg-gray-800'
                            : intensity > 0.7
                            ? 'bg-orange-500'
                            : intensity > 0.4
                            ? 'bg-orange-600'
                            : 'bg-orange-800';

                          return (
                            <div key={index} className="text-center">
                              <div className={`aspect-square ${color} rounded-lg mb-1`} title={`${day.count} questions`}></div>
                              <span className="text-xs text-gray-500">{day.day}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                        <span>Less</span>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
                          <div className="w-3 h-3 bg-orange-800 rounded-sm"></div>
                          <div className="w-3 h-3 bg-orange-600 rounded-sm"></div>
                          <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                        </div>
                        <span>More</span>
                      </div>
                    </div>

                    {progress_data.filter(d => d.questions > 0).length > 0 && (
                      <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                        <h3 className="text-lg font-light text-white mb-4">Last 7 Days</h3>
                        <div className="space-y-2">
                          {progress_data.slice(-7).reverse().map((day) => (
                            <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                              <span className="text-gray-300 text-sm">
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-gray-400 text-sm">{day.questions} questions</span>
                                {day.questions > 0 && (
                                  <span className={`text-sm ${day.accuracy >= 80 ? 'text-emerald-400' : day.accuracy >= 60 ? 'text-blue-400' : 'text-amber-400'}`}>
                                    {day.accuracy}%
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
