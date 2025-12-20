'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project, Video } from '@/lib/supabase';
import { videoApi } from '@/lib/api';
import { ArrowLeft, Plus, Play, Loader2, Video as VideoIcon, X } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddVideo, setShowAddVideo] = useState(false);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
      fetchVideos();
    }
  }, [user, projectId]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        router.push('/dashboard');
      } else {
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
      } else {
        setVideos(data || []);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoAdded = () => {
    fetchVideos();
    setShowAddVideo(false);
  };

  if (!project) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-light">Back to Dashboard</span>
        </button>

        {/* Project Header */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-light text-white mb-3">
                {project.project_name}
              </h1>
              {project.project_desc && (
                <p className="text-gray-400 font-light mb-3">
                  {project.project_desc}
                </p>
              )}
              <p className="text-sm text-gray-500 font-light">
                {videos.length} video{videos.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowAddVideo(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Video
            </button>
          </div>
        </div>

        {/* Videos Section */}
        <div>
          <h2 className="text-2xl font-light text-white mb-6">
            Videos
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                <VideoIcon className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-light text-white mb-3">
                No videos yet
              </h3>
              <p className="text-gray-400 mb-6 font-light">
                Add your first video to start learning
              </p>
              <button
                onClick={() => setShowAddVideo(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Video
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddVideo && (
        <AddVideoModal
          projectId={projectId}
          projectName={project.project_name}
          onClose={() => setShowAddVideo(false)}
          onVideoAdded={handleVideoAdded}
        />
      )}
    </AuthenticatedLayout>
  );
}

interface VideoCardProps {
  video: Video;
}

function VideoCard({ video }: VideoCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/learn/${video.id}`);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div
      onClick={handleClick}
      className="group relative cursor-pointer"
    >
      <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all">
        {/* Thumbnail */}
        <div className="relative h-48 bg-gray-900 flex items-center justify-center">
          <img
            src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded border border-gray-700">
            {formatDuration(video.video_length)}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-light text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-gray-500 font-light">
            Added {new Date(video.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

interface AddVideoModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onVideoAdded: () => void;
}

function AddVideoModal({ projectId, projectName, onClose, onVideoAdded }: AddVideoModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Process video
      const response = await videoApi.processVideo(videoUrl, projectName);

      // Update video with project_id
      const { error: updateError } = await supabase
        .from('videos')
        .update({ project_id: projectId })
        .eq('id', response.video_id);

      if (updateError) {
        console.error('Error linking video to project:', updateError);
      }

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user!.id,
        project_id: projectId,
        video_id: response.video_id,
        activity_desc: `Added new video to project "${projectName}"`,
        activity_type: 'video_added',
        metadata: { video_url: videoUrl }
      });

      // Redirect to learning page
      router.push(`/learn/${response.video_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process video');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-emerald-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 pointer-events-none"></div>

        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-emerald-400 transition-colors z-10 disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-light text-white mb-8 relative z-10">
          Add Video
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label
              htmlFor="videoUrl"
              className="block text-sm font-light text-gray-300 mb-2"
            >
              YouTube Video URL
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
          </div>

          {error && (
            <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-300 font-light">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors disabled:opacity-50 font-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !videoUrl}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-gray-700 disabled:to-gray-600 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add & Start Learning
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
