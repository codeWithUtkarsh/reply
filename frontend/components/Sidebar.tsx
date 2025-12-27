'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project } from '@/lib/supabase';
import { Plus, FolderOpen, BarChart3, FileText, Settings, User, Trash2, Loader2, Coins } from 'lucide-react';
import NewProjectModal from '@/components/NewProjectModal';
import { projectsApi } from '@/lib/api';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();

      // Subscribe to realtime changes on projects table
      const channel = supabase
        .channel('sidebar-projects-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Sidebar: Project changed:', payload);
            // Refetch projects when any change occurs
            fetchProjects();
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
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

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    setDeletingProjectId(projectToDelete.id);
    try {
      await projectsApi.deleteProject(projectToDelete.id);

      // If we're currently viewing this project, navigate to projects page
      if (pathname === `/projects/${projectToDelete.id}`) {
        router.push('/projects');
      }

      // Refresh projects list
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    } finally {
      setDeletingProjectId(null);
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
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
            {userProfile?.role === 'developer' ? (
              'Unlimited credits ∞'
            ) : (
              <>
                {(userProfile?.transcription_credits ?? 0) + (userProfile?.notes_credits ?? 0)} credits

              </>
            )}
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
            <div className="mt-2 ml-2">
              {projects.map((project) => {
                const isActive = pathname === `/projects/${project.id}`;
                return (
                  <div
                    key={project.id}
                    className={`group relative flex items-center gap-2 text-sm transition-all ${
                      isActive
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <button
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="flex-1 pl-6 pr-2 py-2 flex items-center gap-2 text-left"
                    >
                      <FolderOpen className="w-4 h-4 flex-shrink-0" />
                      <span className="font-light truncate">{project.project_name}</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, project)}
                      className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded transition-all"
                      title="Delete project"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Other Menu Items */}
          <button
            onClick={() => router.push('/analytics')}
            className={`w-full px-4 py-3 flex items-center gap-3 text-sm transition-all ${
              pathname === '/analytics'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="font-light">Analytics</span>
          </button>

          <button
            onClick={() => router.push('/notes')}
            className={`w-full px-4 py-3 flex items-center gap-3 text-sm transition-all ${
              pathname === '/notes'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-light">Notes</span>
          </button>

          <button
            onClick={() => router.push('/credits')}
            className={`w-full px-4 py-3 flex items-center gap-3 text-sm transition-all ${
              pathname === '/credits'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span className="font-light">Credits</span>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && projectToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-red-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-900/5 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>

              <h2 className="text-2xl font-light text-white mb-3 text-center">
                Delete Project?
              </h2>

              <p className="text-gray-400 text-center mb-6 font-light">
                Are you sure you want to delete "{projectToDelete.project_name}"? This will also delete all videos in this project. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProjectToDelete(null);
                  }}
                  disabled={deletingProjectId !== null}
                  className="flex-1 px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors disabled:opacity-50 font-light"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingProjectId !== null}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-gray-700 disabled:to-gray-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {deletingProjectId ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
