'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Play, LogIn, UserPlus, Sparkles, Brain, Trophy, BarChart } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const openSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  const openSignUp = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show landing page if user is logged in
  if (user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header with Auth Buttons */}
          <div className="flex justify-end mb-8">
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
          </div>

          {/* Hero Content */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Play className="w-20 h-20 text-primary-600" />
                <Sparkles className="w-8 h-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Preply Video Learning
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
              Transform YouTube videos into interactive learning experiences
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10">
              AI-powered questions, flashcards, and quizzes to enhance your learning
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={openSignUp}
                className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg"
              >
                <UserPlus className="w-5 h-5" />
                Get Started Free
              </button>
              <button
                onClick={openSignIn}
                className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors text-lg shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI-Powered Questions
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Get intelligent questions at key moments during video playback to test your understanding in real-time
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Interactive Flashcards
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Flashcards appear at strategic points to reinforce learning and ensure concept retention
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Comprehensive Quizzes
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Take a final 10-question quiz to assess your overall comprehension and identify areas to review
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <BarChart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Track Your Progress
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor your learning journey with detailed reports and insights on your performance
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              How It Works
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Create an Account
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Sign up for free and get 10 credits to start learning
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Create a Project
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Organize your learning by creating projects for different topics
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Add a Video
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Paste any YouTube URL and let our AI process it for interactive learning
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Start Learning
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Watch, answer questions, take quizzes, and track your progress
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Join now and start learning smarter, not harder
            </p>
            <button
              onClick={openSignUp}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              Create Free Account
            </button>
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
