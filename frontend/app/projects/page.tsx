'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project } from '@/lib/supabase';
import { FolderOpen, Plus, Video, Loader2 } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import NewProjectModal from '@/components/NewProjectModal';

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

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

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-white mb-2">Projects</h1>
            <p className="text-gray-400 font-light">Manage your learning projects</p>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
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
              Create your first project to start organizing your learning materials
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </AuthenticatedLayout>
  );
}

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [videoCount, setVideoCount] = useState(0);

  useEffect(() => {
    fetchVideoCount();
  }, []);

  const fetchVideoCount = async () => {
    try {
      const { count, error } = await supabase
        .from('project_videos')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);

      if (!error && count !== null) {
        setVideoCount(count);
      }
    } catch (error) {
      console.error('Error fetching video count:', error);
    }
  };

  return (
    <div
      onClick={() => router.push(`/projects/${project.id}`)}
      className="group relative cursor-pointer"
    >
      <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-full flex items-center gap-2">
            <Video className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">{videoCount}</span>
          </div>
        </div>

        <h3 className="text-xl font-light text-white mb-2 group-hover:text-emerald-400 transition-colors">
          {project.project_name}
        </h3>

        {project.project_desc && (
          <p className="text-sm text-gray-400 font-light line-clamp-2">
            {project.project_desc}
          </p>
        )}

        <div className="mt-4 text-xs text-gray-500 font-light">
          Created {new Date(project.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
