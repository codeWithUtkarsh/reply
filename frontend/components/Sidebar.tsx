'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project } from '@/lib/supabase';
import { Plus, FolderOpen, BarChart3, FileText, Settings, User } from 'lucide-react';
import NewProjectModal from '@/components/NewProjectModal';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleProjectCreated = () => {
    fetchProjects();
    setShowNewProjectModal(false);
  };

  return (
    <>
      <aside className="w-64 bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 flex flex-col">
        {/* User Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-400">Hello,</p>
              <h2 className="text-xl font-light text-white">
                {user?.email?.split('@')[0]}!
              </h2>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/20 transition-all"
            >
              <User className="w-5 h-5 text-emerald-500" />
            </button>
          </div>

          <div className="text-sm text-gray-400">
            {userProfile?.credit_available || 0} credits available
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {/* Projects Section */}
          <div className="mb-2">
            <div className="px-4 py-2 flex items-center justify-between">
              <button
                onClick={() => router.push('/projects')}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="font-light">Projects</span>
              </button>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="p-1 hover:bg-emerald-500/10 rounded transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
              </button>
            </div>

            {/* Project List */}
            <div className="mt-2">
              {projects.map((project) => {
                const isActive = pathname === `/projects/${project.id}`;
                return (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className={`w-full px-4 py-2 flex items-center gap-2 text-sm transition-all ${
                      isActive
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span className="font-light truncate">{project.project_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Other Menu Items */}
          <button className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all">
            <BarChart3 className="w-4 h-4" />
            <span className="font-light">Analytics</span>
          </button>

          <button className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all">
            <FileText className="w-4 h-4" />
            <span className="font-light">Notes</span>
          </button>
        </nav>

        {/* Settings at Bottom */}
        <div className="p-4 border-t border-gray-800">
          <button className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all">
            <Settings className="w-4 h-4" />
            <span className="font-light">Settings</span>
          </button>
        </div>
      </aside>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}
