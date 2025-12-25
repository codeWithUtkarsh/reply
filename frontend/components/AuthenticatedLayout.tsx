'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { LogOut, User, ChevronDown } from 'lucide-react';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Redirect unauthenticated users to home
    if (!user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 border-b border-gray-800 bg-gradient-to-r from-black to-gray-900 flex items-center justify-end px-8">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800/50 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-light text-white">{user.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-400">
                  {userProfile?.role === 'developer' ? '∞' : (userProfile?.transcription_credits ?? 0) + (userProfile?.notes_credits ?? 0)} credits
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-20 overflow-hidden">
                  <div className="p-3 border-b border-gray-800">
                    <p className="text-sm text-white font-light">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {userProfile?.role === 'developer'
                        ? 'Unlimited credits'
                        : `${(userProfile?.transcription_credits ?? 0) + (userProfile?.notes_credits ?? 0)} credits available`
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-300 hover:bg-gray-800 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-light">Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </main>
  );
}
