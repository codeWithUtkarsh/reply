'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project } from '@/lib/supabase';
import { FolderOpen, Loader2, Video, Plus } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <AuthenticatedLayout>
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
    </AuthenticatedLayout>
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
