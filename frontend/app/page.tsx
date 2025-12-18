'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { videoApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Loader2, LogIn, UserPlus } from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import UserMenu from '@/components/UserMenu';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setAuthMode('signin');
      setShowAuthModal(true);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await videoApi.processVideo(videoUrl, title);
      router.push(`/learn/${response.video_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process video');
    } finally {
      setLoading(false);
    }
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  const openSignUp = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with Auth */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-end">
          {authLoading ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ) : user ? (
            <UserMenu />
          ) : (
            <div className="flex gap-2">
              <button
                onClick={openSignIn}
                className="flex items-center gap-2 px-4 py-2 text-primary-600 dark:text-primary-400 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
              <button
                onClick={openSignUp}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Play className="w-12 h-12 text-primary-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Preply Video Learning
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Learn from videos with AI-powered questions and quizzes
            </p>
          </div>

          {/* Video Input Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="videoUrl"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Video URL
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Video Title (Optional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a custom title..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !videoUrl}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing Video...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    {user ? 'Start Learning' : 'Sign In to Start Learning'}
                  </>
                )}
              </button>
            </form>

            {!user && !authLoading && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                  Please sign in or create an account to start learning
                </p>
              </div>
            )}

            {/* Features */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Features:
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>AI-generated questions during video playback</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Flashcards appear at key moments to test understanding</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Final 10-question quiz to assess comprehension</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Jump to specific video sections when answers are incorrect</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />
    </main>
  );
}
