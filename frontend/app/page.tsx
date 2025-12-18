'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Play, LogIn, UserPlus, Lock, CheckCircle2, BarChart3, Zap } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Circuit Board Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="circuit-background">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="circuit-box"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${20 + Math.random() * 150}px`,
                height: `${20 + Math.random() * 150}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-grid opacity-[0.02]"></div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-radial-gradient"></div>

      {/* Lock icons in corners */}
      <div className="absolute top-8 left-8 opacity-20">
        <Lock className="w-8 h-8 text-gray-600" />
      </div>
      <div className="absolute top-8 right-8 opacity-20">
        <Lock className="w-8 h-8 text-gray-600" />
      </div>
      <div className="absolute bottom-8 left-8 opacity-20">
        <Lock className="w-8 h-8 text-gray-600" />
      </div>
      <div className="absolute bottom-8 right-8 opacity-20">
        <Lock className="w-8 h-8 text-gray-600" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center">
              <Play className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-xl font-semibold tracking-tight">PREPLY</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-sm">
            <button className="px-5 py-2 border border-gray-700 rounded-full text-gray-400 hover:text-white hover:border-gray-500 transition-all">
              Overview
            </button>
            <button className="px-5 py-2 border border-gray-700 rounded-full text-gray-400 hover:text-white hover:border-gray-500 transition-all">
              Technology
            </button>
            <button className="px-5 py-2 border border-gray-700 rounded-full text-gray-400 hover:text-white hover:border-gray-500 transition-all">
              Features
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openSignIn}
              className="px-6 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Log In
            </button>
            <button
              onClick={openSignUp}
              className="px-6 py-2 text-sm font-medium bg-white text-black rounded hover:bg-gray-200 transition-colors"
            >
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-20 pb-32">
          <div className="max-w-5xl mx-auto">
            {/* Central chip/icon */}
            <div className="flex justify-center mb-12">
              <div className="relative">
                {/* Glowing lines from top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-16 w-px h-16 bg-gradient-to-b from-transparent to-emerald-500/50"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-16 w-px h-12 bg-gradient-to-b from-transparent to-emerald-500 opacity-50 blur-sm"></div>

                {/* Main chip */}
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-b from-emerald-950 to-black border border-emerald-500/30 rounded-2xl p-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <Play className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div className="text-[10px] text-emerald-500 font-mono">PREPLY</div>
                    </div>
                  </div>
                </div>

                {/* Corner accents */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-emerald-500/50"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-emerald-500/50"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-emerald-500/50"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-emerald-500/50"></div>
              </div>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl font-light text-center mb-6 tracking-tight">
              Learn to Trust AI
            </h1>

            {/* Subheading */}
            <p className="text-center text-gray-400 text-lg md:text-xl mb-4 max-w-3xl mx-auto">
              Introducing AI-Powered Learning. Ready for
            </p>
            <p className="text-center text-gray-400 text-lg md:text-xl mb-12 max-w-3xl mx-auto">
              the Modern Education Era.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mb-20">
              <button
                onClick={openSignUp}
                className="group relative px-8 py-3 bg-emerald-500 text-black font-medium rounded hover:bg-emerald-400 transition-all duration-300 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Schedule Demo</span>
              </button>
            </div>

            {/* Preorders text */}
            <p className="text-center text-gray-600 text-sm mb-8">
              Free Credits Available Now
            </p>

            {/* Bottom cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <FeatureBox
                icon={<CheckCircle2 className="w-5 h-5" />}
                title="AI Questions"
                subtitle="Smart Platform"
              />
              <FeatureBox
                icon={<BarChart3 className="w-5 h-5" />}
                title="Progress Tracking"
                subtitle="Analytics"
              />
              <FeatureBox
                icon={<Play className="w-5 h-5" />}
                title="Video Learning"
                subtitle="Interactive"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20 border-t border-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-light mb-4">How It Works</h2>
              <p className="text-gray-500">Simple, powerful, effective</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <ProcessStep
                number="01"
                title="Create Account"
                description="Sign up in seconds and receive 10 free credits to start your learning journey."
              />
              <ProcessStep
                number="02"
                title="Add Videos"
                description="Paste any YouTube URL and our AI will transform it into an interactive learning experience."
              />
              <ProcessStep
                number="03"
                title="Learn & Practice"
                description="Engage with AI-generated questions, flashcards, and quizzes tailored to your pace."
              />
              <ProcessStep
                number="04"
                title="Track Progress"
                description="Monitor your learning journey with detailed analytics and personalized insights."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-6 py-20 border-t border-gray-900">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-light mb-6">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-gray-500 mb-8">
              Join educators and students using AI-powered video learning
            </p>
            <button
              onClick={openSignUp}
              className="px-8 py-3 bg-white text-black font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Get Started Free
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-8 border-t border-gray-900">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <p>&copy; 2024 Preply. All rights reserved.</p>
            <div className="flex gap-6">
              <button className="hover:text-gray-400 transition-colors">Privacy</button>
              <button className="hover:text-gray-400 transition-colors">Terms</button>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />

      <style jsx>{`
        .bg-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 100px 100px;
        }

        .bg-radial-gradient {
          background: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.05), transparent 50%);
        }

        .circuit-background {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 1;
        }

        .circuit-box {
          position: absolute;
          border: 1px solid rgba(6, 182, 212, 0.6);
          background: rgba(6, 182, 212, 0.05);
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.2);
          animation: pulse-circuit infinite ease-in-out;
        }

        @keyframes pulse-circuit {
          0%, 100% {
            opacity: 0.3;
            border-color: rgba(6, 182, 212, 0.4);
            box-shadow: 0 0 5px rgba(6, 182, 212, 0.1);
          }
          50% {
            opacity: 0.8;
            border-color: rgba(6, 182, 212, 0.8);
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
          }
        }
      `}</style>
    </main>
  );
}

interface FeatureBoxProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

function FeatureBox({ icon, title, subtitle }: FeatureBoxProps) {
  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
      <div className="relative bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-emerald-500">{icon}</div>
          <div className="text-xs text-gray-600 uppercase tracking-wider">{subtitle}</div>
        </div>
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
    </div>
  );
}

interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
}

function ProcessStep({ number, title, description }: ProcessStepProps) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0">
        <div className="text-5xl font-light text-gray-800">{number}</div>
      </div>
      <div>
        <h3 className="text-2xl font-light mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
