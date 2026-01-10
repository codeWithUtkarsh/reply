'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Play, LogIn, UserPlus, Lock, CheckCircle2, BarChart3, Zap, ChevronLeft, ChevronRight, Crown, Gift } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/projects');
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

  const features = [
    {
      icon: <CheckCircle2 className="w-8 h-8" />,
      label: 'SMART PLATFORM',
      title: 'AI Questions',
      description: 'Get intelligent questions generated from any video content to test your understanding',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-500',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      label: 'ANALYTICS',
      title: 'Progress Tracking',
      description: 'AI-powered reinforcement learning adapts your path in real-time, filling knowledge gaps and maximizing retention based on your unique study behavior',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-500',
    },
    {
      icon: <Play className="w-8 h-8" />,
      label: 'INTERACTIVE',
      title: 'Video Learning',
      description: 'Transform any video into an interactive learning experience with AI',
      gradient: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-500',
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
  };

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToChallenges = () => {
    const element = document.getElementById('challenges');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToWeekOne = () => {
    const element = document.getElementById('week-1');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToPricing = () => {
    const element = document.getElementById('pricing');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
          {/* Left side boxes */}
          {[...Array(25)].map((_, i) => (
            <div
              key={`left-${i}`}
              className="circuit-box"
              style={{
                left: `${Math.random() * 25}%`,
                top: `${Math.random() * 100}%`,
                width: `${20 + Math.random() * 150}px`,
                height: `${20 + Math.random() * 150}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            ></div>
          ))}
          {/* Right side boxes */}
          {[...Array(25)].map((_, i) => (
            <div
              key={`right-${i}`}
              className="circuit-box"
              style={{
                left: `${75 + Math.random() * 25}%`,
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
        <nav className="container mx-auto px-6 py-6 relative">
          <div className="flex items-center justify-between">
            {/* Logo - Left */}
            <div className="flex items-center gap-2 relative">
              {/* Glowing lines from logo */}
              <div className="absolute left-full top-1/2 ml-4 w-32 h-px bg-gradient-to-r from-emerald-500/50 to-transparent"></div>
              <div className="absolute left-full top-1/2 ml-4 w-24 h-px bg-gradient-to-r from-emerald-500 to-transparent blur-sm"></div>

              <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center">
                <Play className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-xl font-semibold tracking-tight">PREPLM</span>
            </div>

            {/* Auth buttons - Right */}
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
          </div>

          {/* Navigation - Absolutely centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 px-2 py-2 bg-gradient-to-b from-gray-900/50 to-black/50 border border-gray-800 rounded-full backdrop-blur-sm">
            <button
              onClick={scrollToChallenges}
              className="px-6 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full transition-all"
            >
              Learner Challenges
            </button>
            <button
              onClick={scrollToFeatures}
              className="px-6 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full transition-all"
            >
              How We Help
            </button>
            <button
              onClick={scrollToWeekOne}
              className="px-6 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full transition-all"
            >
              What Happens in Week 1
            </button>
            <button
              onClick={scrollToPricing}
              className="px-6 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full transition-all"
            >
              Pricing
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-20 pb-32">
          <div className="max-w-5xl mx-auto">
            {/* Central chip/icon */}
            <div className="flex justify-center mb-12" style={{ perspective: '1000px' }}>
              <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
                {/* Glowing lines from top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-20 w-px h-20 bg-gradient-to-b from-transparent to-emerald-500/50"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-20 w-px h-16 bg-gradient-to-b from-transparent to-emerald-500 opacity-50 blur-sm"></div>

                {/* Main chip with 3D effect */}
                <div className="relative chip-3d">
                  <div className="absolute inset-0 bg-emerald-500/30 blur-3xl"></div>
                  <div className="relative w-48 h-48 bg-gradient-to-b from-emerald-950 to-black border-2 border-emerald-500/40 rounded-3xl p-8 flex items-center justify-center shadow-2xl">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <Play className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div className="text-sm text-emerald-500 font-mono tracking-wider">PREPLM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl font-light text-center mb-2 tracking-tight">
              <span className="text-white">Learn </span>
              <span className="text-white font-bold">3x Faster</span>
            </h1>
            <h2 className="text-4xl md:text-6xl font-light text-center mb-8 tracking-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
                From Any Video
              </span>
            </h2>

            {/* Subheading */}
            <p className="text-center text-gray-400 text-lg md:text-xl mb-4 max-w-3xl mx-auto leading-relaxed">
              Reinforcement learning AI personalizes your path, filling knowledge gaps automatically. Cut down your preparation time by 50% <span className="text-white font-semibold">Never forget what you learn.</span>
            </p>

            {/* CTA Button */}
            <div className="flex justify-center">
              <button
                onClick={openSignUp}
                className="group relative px-8 py-3 bg-emerald-500 text-black font-medium rounded hover:bg-emerald-400 transition-all duration-300 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Schedule Demo</span>
              </button>
            </div>
          </div>
        </section>

        {/* Fancy Carousel Feature Section */}
        <section id="features" className="container mx-auto px-6 py-20 border-t border-gray-900 relative">
          <div className="max-w-7xl mx-auto">
            <div className="relative h-[500px] md:h-[600px] overflow-hidden rounded-3xl">
              {/* Carousel slides */}
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                    index === currentSlide
                      ? 'opacity-100 translate-x-0 scale-100'
                      : index < currentSlide
                      ? 'opacity-0 -translate-x-full scale-95'
                      : 'opacity-0 translate-x-full scale-95'
                  }`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}`}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                  {/* Animated particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 3}s`,
                          animationDuration: `${2 + Math.random() * 3}s`,
                        }}
                      ></div>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="relative h-full flex items-center">
                    <div className="container mx-auto px-8 md:px-16">
                      <div className="max-w-3xl">
                        {/* Icon */}
                        <div className={`mb-8 ${feature.iconColor} transform transition-transform duration-700 ${
                          index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                        }`}>
                          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10">
                            {feature.icon}
                          </div>
                        </div>

                        {/* Label */}
                        <div className={`mb-4 transition-all duration-700 delay-100 ${
                          index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                        }`}>
                          <span className={`text-sm font-light uppercase tracking-widest ${feature.iconColor}`}>
                            {feature.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className={`text-5xl md:text-7xl font-light text-white mb-6 transition-all duration-700 delay-200 ${
                          index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                        }`}>
                          {feature.title}
                        </h2>

                        {/* Description */}
                        <p className={`text-xl text-gray-300 font-light mb-8 max-w-2xl transition-all duration-700 delay-300 ${
                          index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                        }`}>
                          {feature.description}
                        </p>

                        {/* CTA Button */}
                        <div className={`transition-all duration-700 delay-400 ${
                          index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                        }`}>
                          <button
                            onClick={openSignUp}
                            className="px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                          >
                            Learn More
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-all z-10 group"
              >
                <ChevronLeft className="w-6 h-6 group-hover:scale-125 transition-transform" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-all z-10 group"
              >
                <ChevronRight className="w-6 h-6 group-hover:scale-125 transition-transform" />
              </button>

              {/* Dot Indicators */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      index === currentSlide
                        ? 'w-12 bg-white'
                        : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Problem with Video Learning Section */}
        <section id="challenges" className="container mx-auto px-6 py-20 border-t border-gray-900 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <div className="inline-block mb-6">
                <div className="flex items-center gap-3 px-4 py-2 border border-red-500/30 rounded-full bg-red-950/20">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-400 font-light uppercase tracking-wider">The Challenge</span>
                </div>
              </div>
              <h2 className="text-4xl md:text-6xl font-light mb-6 leading-tight">
                The Problem with <br />
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent font-normal">Video Learning</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
                Traditional video platforms aren't designed for learning. They're built for entertainment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ProblemCard
                icon={
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 15s1.5-2 4-2 4 2 4 2" transform="scale(1,-1) translate(0,-24)" />
                    <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" />
                    <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" />
                  </svg>
                }
                iconColor="text-red-500"
                glowColor="red"
                stat="67%"
                title="Poor Retention"
                description="Students struggle to retain information from video lectures"
                delay="0"
              />
              <ProblemCard
                icon={
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                  </svg>
                }
                iconColor="text-orange-500"
                glowColor="orange"
                stat="85%"
                title="Passive Watching"
                description="Passive video watching leads to poor engagement and low retention"
                delay="100"
              />
              <ProblemCard
                icon={
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
                iconColor="text-yellow-500"
                glowColor="yellow"
                stat="2+ hrs"
                title="Wasted Time"
                description="Students spend hours rewatching videos to find specific concepts"
                delay="200"
              />
              <ProblemCard
                icon={
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                }
                iconColor="text-gray-400"
                glowColor="gray"
                stat="0%"
                title="No Tracking"
                description="No way to track comprehension in real-time while watching"
                delay="300"
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
                title="Adaptive Learning Path"
                description="Our reinforcement learning AI optimizes what you learn next, filling knowledge gaps and maximizing retention based on your unique study patterns."
              />
            </div>
          </div>
        </section>

        {/* What Happens in Week 1 Section */}
        <section id="week-1" className="container mx-auto px-6 py-20 border-t border-gray-900 relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-light mb-6 leading-tight">
                Transform Your First Week from <br />
                <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent font-normal">Wasted Time</span> to{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-normal">Mastery</span>
              </h2>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto font-light">
                While others spend <span className="text-red-400 font-normal">10+ hours watching</span>,
                you'll achieve <span className="text-emerald-400 font-normal">3x better results</span> in half the time
              </p>
            </div>

            {/* Before & After Visual */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* Traditional - The Problem */}
              <div className="relative group">
                <div className="absolute inset-0 bg-red-500/5 rounded-2xl"></div>
                <div className="relative bg-gradient-to-br from-gray-900 to-black border border-red-500/20 rounded-2xl p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="text-sm text-red-400 font-light uppercase tracking-wider mb-2">Before PrepLM</div>
                      <h3 className="text-3xl font-light text-white">The Old Way</h3>
                    </div>
                    <div className="text-5xl font-light text-red-400">10h</div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <ImpactItem
                      text="Hours lost rewatching videos"
                      negative
                    />
                    <ImpactItem
                      text="Passive learning, poor retention"
                      negative
                    />
                    <ImpactItem
                      text="No way to verify understanding"
                      negative
                    />
                    <ImpactItem
                      text="Forget 70% within days"
                      negative
                    />
                  </div>

                  <div className="pt-6 border-t border-red-500/10">
                    <div className="text-sm text-gray-500">Retention Rate</div>
                    <div className="text-3xl font-light text-red-400">30%</div>
                  </div>
                </div>
              </div>

              {/* With PrepLM - The Solution */}
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl"></div>
                <div className="relative bg-gradient-to-br from-emerald-950 to-black border-2 border-emerald-500/40 rounded-2xl p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="text-sm text-emerald-400 font-light uppercase tracking-wider mb-2">With PrepLM</div>
                      <h3 className="text-3xl font-light text-white">The Smart Way</h3>
                    </div>
                    <div className="text-5xl font-light text-emerald-400">5h</div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <ImpactItem
                      text="AI-powered active learning"
                    />
                    <ImpactItem
                      text="Personalized path that fills knowledge gaps"
                    />
                    <ImpactItem
                      text="Adaptive content sequencing via RL"
                    />
                    <ImpactItem
                      text="Instant concept navigation"
                    />
                    <ImpactItem
                      text="90% retention guaranteed"
                    />
                  </div>

                  <div className="pt-6 border-t border-emerald-500/20">
                    <div className="text-sm text-gray-400">Retention Rate</div>
                    <div className="text-3xl font-light text-emerald-400">90%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Stats */}
            <div className="bg-gradient-to-b from-gray-900/50 to-black border border-gray-800 rounded-2xl p-8 md:p-12">
              <div className="text-center mb-10">
                <h3 className="text-2xl md:text-3xl font-light text-white mb-3">
                  The Real Impact
                </h3>
                <p className="text-gray-400">Measurable results from day one</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="mb-4">
                    <div className="text-6xl font-light text-emerald-400 mb-2 group-hover:scale-110 transition-transform">50%</div>
                    <div className="text-sm text-emerald-500 uppercase tracking-wider">Time Saved</div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Reclaim <span className="text-white font-normal">5+ hours weekly</span> for actual practice
                  </p>
                </div>

                <div className="text-center group border-x border-gray-800">
                  <div className="mb-4">
                    <div className="text-6xl font-light text-emerald-400 mb-2 group-hover:scale-110 transition-transform">3x</div>
                    <div className="text-sm text-emerald-500 uppercase tracking-wider">Faster Mastery</div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Learn in <span className="text-white font-normal">1 week</span> what takes others a month
                  </p>
                </div>

                <div className="text-center group">
                  <div className="mb-4">
                    <div className="text-6xl font-light text-emerald-400 mb-2 group-hover:scale-110 transition-transform">90%</div>
                    <div className="text-sm text-emerald-500 uppercase tracking-wider">Retention</div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    <span className="text-white font-normal">Remember what you learn</span>, not just watch it
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-6 py-20 border-t border-gray-900 relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block mb-6">
                <div className="flex items-center gap-3 px-4 py-2 border border-emerald-500/30 rounded-full bg-emerald-950/20">
                  <Crown className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-light uppercase tracking-wider">Pricing Plans</span>
                </div>
              </div>
              <h2 className="text-4xl md:text-6xl font-light mb-6 leading-tight">
                Choose Your <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-normal">Learning Plan</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
                Start free or unlock unlimited learning with our flexible plans
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {/* Free Plan */}
              <div className="relative group h-full">
                <div className="absolute inset-0 bg-gray-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-700 group-hover:border-gray-600 rounded-2xl p-8 transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gray-500/10 border border-gray-500/30 rounded-xl flex items-center justify-center">
                      <Gift className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-light text-white">Starter</h3>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">£0</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 min-h-[240px]">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm font-medium">75 mins video learning</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-gray-300 text-sm font-medium">300 mins AI notes</div>
                        <div className="text-gray-500 text-xs">Automated summaries</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">10% referral rewards</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">Core features</span>
                    </li>
                  </ul>

                  <button
                    onClick={openSignUp}
                    className="w-full py-3 px-6 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800/50 hover:border-gray-600 transition-all mt-auto"
                  >
                    Start Free
                  </button>
                </div>
              </div>

              {/* Student Plan */}
              <div className="relative group h-full">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </div>
                </div>
                <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl"></div>
                <div className="relative bg-gradient-to-br from-emerald-950/80 to-black border-2 border-emerald-500/40 rounded-2xl p-8 shadow-2xl h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-light text-white">Student</h3>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">£9</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 min-h-[240px]">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white text-sm font-medium">2.4x more video learning</div>
                        <div className="text-emerald-400/70 text-xs">180 mins</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white text-sm font-medium">3x more AI notes</div>
                        <div className="text-emerald-400/70 text-xs">900 mins generation</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white text-sm">20% streak bonus saves</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white text-sm">15% referral rewards</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white text-sm">Priority support</span>
                    </li>
                  </ul>

                  <button
                    onClick={openSignUp}
                    className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-medium rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg mt-auto"
                  >
                    Start Learning
                  </button>
                </div>
              </div>

              {/* Professional Plan */}
              <div className="relative group h-full">
                <div className="absolute inset-0 bg-amber-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-amber-950/50 to-black border border-amber-700/50 group-hover:border-amber-600/70 rounded-2xl p-8 transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center">
                      <Crown className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-light text-white">Pro</h3>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">£59</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 min-h-[240px]">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white text-sm font-medium">12x more video learning</div>
                        <div className="text-amber-400/70 text-xs">900 mins</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white text-sm font-medium">16x more AI notes</div>
                        <div className="text-amber-400/70 text-xs">5,000 mins generation</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white text-sm">50% streak bonus saves</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white text-sm">Priority processing queue</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white text-sm">Bulk export tools</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white text-sm">15% referral rewards</span>
                    </li>
                  </ul>

                  <button
                    onClick={openSignUp}
                    className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-medium rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg mt-auto"
                  >
                    Go Pro
                  </button>
                </div>
              </div>

              {/* Pay as You Go */}
              <div className="relative group h-full">
                <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-cyan-950/50 to-black border border-cyan-700/50 group-hover:border-cyan-600/70 rounded-2xl p-8 transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-2xl font-light text-white">Flex</h3>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">From £5</span>
                    </div>
                    <p className="text-sm text-cyan-400/70 mt-1">One-time • No subscription</p>
                  </div>

                  <ul className="space-y-3 mb-8 min-h-[240px]">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white text-sm">Pay only for what you use</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white text-sm font-medium">Credits never expire</div>
                        <div className="text-cyan-400/70 text-xs">Use anytime, no rush</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white text-sm">Save up to 37% on bulk</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white text-sm">Mix video & notes credits</span>
                    </li>
                  </ul>

                  <button
                    onClick={openSignUp}
                    className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg mt-auto"
                  >
                    Buy Credits
                  </button>
                </div>
              </div>
            </div>

            {/* Features comparison note */}
            <div className="mt-16 text-center">
              <p className="text-gray-500 text-sm">
                All plans include AI-powered learning, progress tracking, and mobile access.
                <br />
                Subscriptions reset monthly. Pay as You Go credits never expire.
              </p>
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
            <p>&copy; 2025 PrepLM. All rights reserved.</p>
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

        .chip-3d {
          transform: translateZ(50px);
          transition: transform 0.3s ease;
          box-shadow:
            0 20px 40px rgba(0, 0, 0, 0.5),
            0 0 60px rgba(16, 185, 129, 0.3);
        }

        .chip-3d:hover {
          transform: translateZ(70px) scale(1.05);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .problem-card-animate {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </main>
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

interface ProblemCardProps {
  icon: React.ReactNode;
  iconColor: string;
  glowColor: string;
  stat: string;
  title: string;
  description: string;
  delay: string;
}

interface ImpactItemProps {
  text: string;
  negative?: boolean;
}

function ImpactItem({ text, negative }: ImpactItemProps) {
  return (
    <div className="flex items-start gap-3">
      {negative ? (
        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      ) : (
        <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
      <p className={`${negative ? 'text-gray-400' : 'text-gray-200'} font-light`}>
        {text}
      </p>
    </div>
  );
}

function ProblemCard({ icon, iconColor, glowColor, stat, title, description, delay }: ProblemCardProps) {
  const glowColors: Record<string, string> = {
    red: 'group-hover:shadow-red-500/20',
    orange: 'group-hover:shadow-orange-500/20',
    yellow: 'group-hover:shadow-yellow-500/20',
    gray: 'group-hover:shadow-gray-500/20',
  };

  const borderColors: Record<string, string> = {
    red: 'group-hover:border-red-500/30',
    orange: 'group-hover:border-orange-500/30',
    yellow: 'group-hover:border-yellow-500/30',
    gray: 'group-hover:border-gray-500/30',
  };

  return (
    <div
      className="group relative problem-card-animate"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Animated border gradient */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"></div>

      {/* Main card */}
      <div className={`relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-gray-800 ${borderColors[glowColor]} rounded-2xl p-8 transition-all duration-500 ${glowColors[glowColor]} shadow-xl group-hover:shadow-2xl group-hover:-translate-y-1`}>
        {/* Icon container with floating animation */}
        <div className="relative mb-6">
          <div className={`absolute inset-0 ${iconColor} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}></div>
          <div className={`relative ${iconColor} transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
            {icon}
          </div>
        </div>

        {/* Stat with counter effect feel */}
        <div className="relative mb-4">
          <div className={`text-5xl font-light text-white mb-1 transform group-hover:scale-105 transition-transform duration-300`}>
            {stat}
          </div>
          <div className={`h-1 w-12 ${iconColor} opacity-50 rounded-full`}></div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-light text-white mb-3 group-hover:text-gray-100 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed font-light group-hover:text-gray-400 transition-colors">
          {description}
        </p>

        {/* Decorative corner element */}
        <div className={`absolute bottom-4 right-4 w-8 h-8 ${iconColor} opacity-5 group-hover:opacity-10 transition-opacity`}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface PricingFeatureProps {
  text: string;
}

function PricingFeature({ text }: PricingFeatureProps) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      <span className="text-gray-300 text-sm">{text}</span>
    </li>
  );
}
