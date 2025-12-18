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

      // Process video
      try {
        const response = await videoApi.processVideo(videoUrl, projectName);

        // Update video with project_id
        const { error: updateError } = await supabase
          .from('videos')
          .update({ project_id: project.id })
          .eq('id', response.video_id);

        if (updateError) {
          console.error('Error linking video to project:', updateError);
        }

        // Log activity
        await supabase.from('activity_log').insert({
          user_id: user!.id,
          project_id: project.id,
          video_id: response.video_id,
          activity_desc: `Created project "${projectName}" and added first video`,
          activity_type: 'project_created',
          metadata: { video_url: videoUrl }
        });

        // Redirect to learning page
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
            <FolderPlus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Project
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Create a project and add your first video to start learning
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="projectDesc"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 resize-none"
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Your First Video
            </h3>

            <div>
              <label
                htmlFor="videoUrl"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Supported formats: youtube.com/watch?v=..., youtu.be/..., or just the video ID
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !projectName || !videoUrl}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
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
