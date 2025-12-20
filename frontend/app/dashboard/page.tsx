'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project } from '@/lib/supabase';
import { Plus, FolderOpen, Loader2, Video, BarChart3, FileText, Settings, ChevronDown, ChevronRight, Play, User } from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import NewProjectModal from '@/components/NewProjectModal';

export default function Dashboard() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Redirect unauthenticated users to home
    if (!user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    fetchProjects();
    setShowNewProjectModal(false);
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
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
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 flex flex-col">
        {/* User Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-400">Hello,</p>
              <h2 className="text-xl font-light text-white">
                {user.email?.split('@')[0]}!
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
                onClick={() => setShowNewProjectModal(true)}
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
              {projects.map((project) => (
                <ProjectNav
                  key={project.id}
                  project={project}
                  isExpanded={expandedProjects.has(project.id)}
                  onToggle={() => toggleProject(project.id)}
                />
              ))}
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center">
                <FolderOpen className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-3xl font-light text-white mb-4">
                No projects yet
              </h3>
              <p className="text-gray-400 mb-8 font-light">
                Create your first project to start learning from videos with AI-powered insights
              </p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Project
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-light text-white mb-2">Your Topics</h1>
                <p className="text-gray-400 font-light">Select a project to view your learning materials</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <TopicCard key={project.id} project={project} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </main>
  );
}

interface ProjectNavProps {
  project: Project;
  isExpanded: boolean;
  onToggle: () => void;
}

function ProjectNav({ project, isExpanded, onToggle }: ProjectNavProps) {
  const router = useRouter();
  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    if (isExpanded) {
      // Fetch topics/videos for this project
      fetchTopics();
    }
  }, [isExpanded]);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('project_id', project.id);

      if (!error && data) {
        setTopics(data);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <span className="font-light truncate">{project.project_name}</span>
      </button>

      {isExpanded && topics.length > 0 && (
        <div className="ml-6">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-400 transition-all"
            >
              <Play className="w-3 h-3" />
              <span className="font-light truncate">{topic.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface TopicCardProps {
  project: Project;
}

function TopicCard({ project }: TopicCardProps) {
  const router = useRouter();
  const [videoCount, setVideoCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideoCount();
  }, [project.id]);

  const fetchVideoCount = async () => {
    try {
      const { count, error } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);

      if (error) {
        console.error('Error fetching video count:', error);
      } else {
        setVideoCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching video count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    router.push(`/projects/${project.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative cursor-pointer"
    >
      <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-8 hover:border-emerald-500/30 transition-all">
        <div className="flex items-start justify-between mb-6">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <FolderOpen className="w-7 h-7 text-emerald-500" />
          </div>
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin"></div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-full">
              <Video className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gray-400">{videoCount}</span>
            </div>
          )}
        </div>

        <h3 className="text-2xl font-light text-white mb-3 group-hover:text-emerald-400 transition-colors">
          {project.project_name}
        </h3>

        {project.project_desc && (
          <p className="text-sm text-gray-400 font-light line-clamp-2 mb-4">
            {project.project_desc}
          </p>
        )}

        <div className="text-xs text-gray-600 font-light">
          Created {new Date(project.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
