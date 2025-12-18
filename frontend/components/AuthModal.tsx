'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Loader2, Mail, Lock, Chrome } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, mode: initialMode }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (mode === 'signin') {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password);
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        if (mode === 'signup') {
          setError('Success! Please check your email to verify your account.');
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-emerald-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-emerald-400 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-light text-white mb-8 relative z-10">
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-light text-gray-300 mb-2"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500/50 w-5 h-5" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-black border border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-gray-500 font-light transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-light text-gray-300 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500/50 w-5 h-5" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-black border border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-gray-500 font-light transition-all"
              />
            </div>
          </div>

          {error && (
            <div className={`p-4 rounded-xl border ${
              error.includes('Success')
                ? 'bg-emerald-950/30 border-emerald-500/30'
                : 'bg-red-950/30 border-red-500/30'
            }`}>
              <p className={`text-sm font-light ${
                error.includes('Success')
                  ? 'text-emerald-300'
                  : 'text-red-300'
              }`}>
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-gray-700 disabled:to-gray-600 text-white font-light py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {mode === 'signin' ? 'Signing In...' : 'Signing Up...'}
              </>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-6 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-emerald-500/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-black text-gray-400 font-light">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-6 w-full bg-black border border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-gray-200 font-light py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Chrome className="w-5 h-5" />
            Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400 font-light relative z-10">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-emerald-400 hover:text-emerald-300 font-normal transition-colors"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
