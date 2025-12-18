'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Play, LogIn, UserPlus, Sparkles, Brain, Trophy, BarChart, Zap, Target, Award } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin glow-cyan"></div>
          <p className="text-gray-300 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show landing page if user is logged in
  if (user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900"></div>

        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

        {/* Floating particles */}
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Preply
            </div>
            <div className="flex gap-3">
              <button
                onClick={openSignIn}
                className="group relative px-6 py-2.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-cyan-500/50 rounded-lg transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center gap-2 text-gray-300 group-hover:text-white transition-colors">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </span>
              </button>
              <button
                onClick={openSignUp}
                className="group relative px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-glow"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center gap-2 text-white">
                  <UserPlus className="w-4 h-4" />
                  Get Started
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-5xl mx-auto text-center">
            {/* Animated Icon */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative animate-float">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-3xl blur-2xl opacity-50 animate-pulse-glow"></div>
                <div className="relative bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-3xl p-8">
                  <Play className="w-16 h-16 text-cyan-400" />
                  <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Hero Text */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-cyan-100 to-purple-100 bg-clip-text text-transparent animate-gradient">
                Transform Learning with
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                AI-Powered Videos
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Turn any YouTube video into an interactive learning experience with
              <span className="text-cyan-400 font-semibold"> AI-generated questions</span>,
              <span className="text-purple-400 font-semibold"> smart flashcards</span>, and
              <span className="text-pink-400 font-semibold"> personalized quizzes</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center flex-wrap mb-12">
              <button
                onClick={openSignUp}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-glow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center gap-2 text-white">
                  <Zap className="w-5 h-5" />
                  Start Learning Free
                </span>
              </button>
              <button
                onClick={openSignIn}
                className="group relative px-8 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 rounded-xl font-bold text-lg overflow-hidden transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center gap-2 text-white">
                  <LogIn className="w-5 h-5" />
                  Sign In
                </span>
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 justify-center text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>10 Free Credits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse animation-delay-1000"></div>
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-2000"></div>
                <span>Start in Seconds</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature Cards */}
              <FeatureCard
                icon={<Brain className="w-8 h-8" />}
                title="AI Questions"
                description="Smart questions appear during videos to test understanding in real-time"
                gradient="from-blue-500 to-cyan-500"
                delay="0"
              />
              <FeatureCard
                icon={<Sparkles className="w-8 h-8" />}
                title="Flashcards"
                description="Strategic flashcards reinforce learning at key moments"
                gradient="from-purple-500 to-pink-500"
                delay="100"
              />
              <FeatureCard
                icon={<Trophy className="w-8 h-8" />}
                title="Smart Quizzes"
                description="Comprehensive quizzes assess your overall comprehension"
                gradient="from-green-500 to-emerald-500"
                delay="200"
              />
              <FeatureCard
                icon={<BarChart className="w-8 h-8" />}
                title="Track Progress"
                description="Detailed insights and reports on your learning journey"
                gradient="from-orange-500 to-red-500"
                delay="300"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>

            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 opacity-30"></div>

              <div className="space-y-8">
                <StepCard
                  number="1"
                  title="Create Your Account"
                  description="Sign up in seconds and get 10 free credits to start your learning journey"
                  icon={<UserPlus className="w-6 h-6" />}
                />
                <StepCard
                  number="2"
                  title="Create a Project"
                  description="Organize your videos by topic or subject into dedicated projects"
                  icon={<Target className="w-6 h-6" />}
                />
                <StepCard
                  number="3"
                  title="Add Videos"
                  description="Paste any YouTube URL and watch AI transform it into an interactive lesson"
                  icon={<Play className="w-6 h-6" />}
                />
                <StepCard
                  number="4"
                  title="Learn & Excel"
                  description="Engage with questions, flashcards, quizzes, and track your progress"
                  icon={<Award className="w-6 h-6" />}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                    Ready to Transform Your Learning?
                  </span>
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Join thousands of learners and start your journey today
                </p>
                <button
                  onClick={openSignUp}
                  className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-glow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative flex items-center gap-3 text-white">
                    <Sparkles className="w-6 h-6 animate-bounce" />
                    Get Started Free
                    <Sparkles className="w-6 h-6 animate-bounce animation-delay-500" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-gray-800">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2024 Preply Video Learning. Transform learning with AI.</p>
          </div>
        </footer>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .glow-cyan {
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
        }

        .shadow-glow {
          box-shadow: 0 0 30px rgba(34, 211, 238, 0.3), 0 0 60px rgba(168, 85, 247, 0.3);
        }

        .shadow-glow-lg {
          box-shadow: 0 0 40px rgba(34, 211, 238, 0.4), 0 0 80px rgba(168, 85, 247, 0.4);
        }

        .shadow-glow-xl {
          box-shadow: 0 0 50px rgba(34, 211, 238, 0.5), 0 0 100px rgba(168, 85, 247, 0.5);
        }

        .bg-grid-pattern {
          background-image:
            linear-gradient(rgba(100, 100, 100, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 100, 100, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .floating-particles .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, rgba(34, 211, 238, 0.8), transparent);
          border-radius: 50%;
          animation: float-up linear infinite;
        }

        @keyframes float-up {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: string;
}

function FeatureCard({ icon, title, description, gradient, delay }: FeatureCardProps) {
  return (
    <div
      className="group relative"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`}></div>
      <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 group-hover:border-gray-600 rounded-2xl p-6 transition-all duration-300 hover:transform hover:scale-105">
        <div className={`inline-flex p-3 bg-gradient-to-r ${gradient} rounded-xl mb-4 text-white`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function StepCard({ number, title, description, icon }: StepCardProps) {
  return (
    <div className="relative flex gap-6 group">
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
        <div className="relative w-16 h-16 bg-gray-800 border-2 border-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold text-white z-10">
          {number}
        </div>
      </div>
      <div className="flex-1 bg-gray-800/30 backdrop-blur-sm border border-gray-700 group-hover:border-gray-600 rounded-xl p-6 transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-cyan-400">{icon}</div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
}
