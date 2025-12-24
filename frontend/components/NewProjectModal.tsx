'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { videoApi } from '@/lib/api';
import { X, Loader2, FolderPlus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export default function NewProjectModal({ isOpen, onClose, onProjectCreated }: NewProjectModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Extract video ID
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        setError('Invalid YouTube URL. Please provide a valid YouTube video link.');
        setLoading(false);
        return;
      }

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          project_name: projectName,
          project_desc: projectDesc,
          user_id: user!.id,
        })
        .select()
        .single();

      if (projectError) {
        setError('Failed to create project: ' + projectError.message);
        setLoading(false);
        return;
      }

      // Process video and link to project (sync - temporary until migration is applied)
      try {
        const response = await videoApi.processVideo(videoUrl, projectName, project.id);

        // Log activity
        await supabase.from('activity_log').insert({
          user_id: user!.id,
          project_id: project.id,
          video_id: response.video_id,
          activity_desc: `Created project "${projectName}" and added first video`,
          activity_type: 'project_created',
          metadata: { video_url: videoUrl }
        });

        // Redirect to learning page immediately (video will process in background)
        router.push(`/learn/${response.video_id}`);
      } catch (videoError: any) {
        // Project created but video processing failed
        setError('Project created, but failed to process video: ' + (videoError.response?.data?.detail || 'Unknown error'));
        onProjectCreated();
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setProjectName('');
      setProjectDesc('');
      setVideoUrl('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-emerald-500/30 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 pointer-events-none rounded-2xl"></div>

        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-emerald-400 transition-colors disabled:opacity-50 z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
            <FolderPlus className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-light text-white">
            Create New Project
          </h2>
        </div>

        <p className="text-gray-400 font-light mb-6 relative z-10">
          Create a project and add your first video to start learning
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-light text-gray-300 mb-2"
            >
              Project Name *
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Web Development, Machine Learning, etc."
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-black border border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-gray-500 font-light transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="projectDesc"
              className="block text-sm font-light text-gray-300 mb-2"
            >
              Project Description (Optional)
            </label>
            <textarea
              id="projectDesc"
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              placeholder="Brief description of what you're learning in this project..."
              rows={3}
              disabled={loading}
              className="w-full px-4 py-3 bg-black border border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-gray-500 font-light transition-all disabled:opacity-50 resize-none"
            />
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-light text-white mb-4">
              Add Your First Video
            </h3>

            <div>
              <label
                htmlFor="videoUrl"
                className="block text-sm font-light text-gray-300 mb-2"
              >
                YouTube Video URL *
              </label>
              <input
                type="url"
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-black border border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-gray-500 font-light transition-all disabled:opacity-50"
              />
              <p className="mt-2 text-sm text-gray-500 font-light">
                Supported formats: youtube.com/watch?v=..., youtu.be/..., or just the video ID
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-300 font-light">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors disabled:opacity-50 font-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !projectName || !videoUrl}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-gray-700 disabled:to-gray-600 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Project...
                </>
              ) : (
                <>
                  <FolderPlus className="w-5 h-5" />
                  Create Project & Start Learning
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
