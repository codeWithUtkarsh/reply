'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project } from '@/lib/supabase';
import { videoApi } from '@/lib/api';
import { ArrowLeft, Plus, Play, Loader2, Video as VideoIcon, X, Search, Clock, Trash2 } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

type SortOption = 'newest' | 'oldest' | 'title' | 'duration';

interface Video {
  id: string;
  title: string;
  video_length: number;
  url: string;
  created_at: string;
}

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
      fetchVideos();
    }
  }, [user, projectId]);

  useEffect(() => {
    filterAndSortVideos();
  }, [videos, searchQuery, sortBy]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        router.push('/projects');
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
      
      // Fetch video IDs from junction table
      const { data: projectVideos, error: junctionError } = await supabase
        .from('project_videos')
        .select('video_id')
        .eq('project_id', projectId);

      if (junctionError) {
        console.error('Error fetching project videos:', junctionError);
        setLoading(false);
        return;
      }

      if (!projectVideos || projectVideos.length === 0) {
        setVideos([]);
        setLoading(false);
        return;
      }

      const videoIds = projectVideos.map(pv => pv.video_id);

      // Fetch video details
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .in('id', videoIds);

      if (videosError) {
        console.error('Error fetching videos:', videosError);
      } else {
        setVideos(videosData || []);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortVideos = () => {
    let result = [...videos];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'duration':
        result.sort((a, b) => b.video_length - a.video_length);
        break;
    }

    setFilteredVideos(result);
  };

  const handleVideoAdded = () => {
    fetchVideos();
    setShowAddVideo(false);
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
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-light">Back to Projects</span>
        </button>

        {/* Project Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-light text-white mb-2">
              {project.project_name}
            </h1>
            {project.project_desc && (
              <p className="text-gray-400 font-light">
                {project.project_desc}
              </p>
            )}
            <p className="text-sm text-gray-500 font-light mt-2">
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

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-emerald-500/50 focus:outline-none transition-all cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title (A-Z)</option>
            <option value="duration">Duration</option>
          </select>
        </div>

        {/* Videos List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <VideoIcon className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-light text-white mb-3">
              {searchQuery ? 'No videos found' : 'No videos yet'}
            </h3>
            <p className="text-gray-400 mb-6 font-light">
              {searchQuery ? 'Try a different search term' : 'Add your first video to start learning'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddVideo(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Video
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVideos.map((video) => (
              <VideoListItem
                key={video.id}
                video={video}
                formatDuration={formatDuration}
                projectId={projectId}
                onVideoDeleted={fetchVideos}
              />
            ))}
          </div>
        )}
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

interface VideoListItemProps {
  video: Video;
  formatDuration: (seconds: number) => string;
  projectId: string;
  onVideoDeleted: () => void;
}

function VideoListItem({ video, formatDuration, projectId, onVideoDeleted }: VideoListItemProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await videoApi.deleteVideo(video.id, projectId);
      onVideoDeleted();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div
        onClick={() => router.push(`/learn/${video.id}`)}
        className="group bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-xl p-4 hover:border-emerald-500/30 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="relative w-40 h-24 flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
              {formatDuration(video.video_length)}
            </div>
          </div>

          {/* Video Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-light text-white mb-1 group-hover:text-emerald-400 transition-colors truncate">
              {video.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(video.video_length)}</span>
              </div>
              <span>•</span>
              <span>Added {new Date(video.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Delete Icon */}
            <button
              onClick={handleDelete}
              className="w-10 h-10 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-all"
              title="Delete video"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>

            {/* Play Icon */}
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
              <Play className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-red-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-900/5 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>

              <h2 className="text-2xl font-light text-white mb-3 text-center">
                Delete Video?
              </h2>

              <p className="text-gray-400 text-center mb-6 font-light">
                Are you sure you want to delete "{video.title}"? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors disabled:opacity-50 font-light"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-gray-700 disabled:to-gray-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? (
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
      // Process video with project_id (async)
      const response = await videoApi.processVideoAsync(videoUrl, undefined, projectId, user!.id);

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user!.id,
        project_id: projectId,
        video_id: response.video_id,
        activity_desc: `Added new video to project "${projectName}"`,
        activity_type: 'video_added',
        metadata: { video_url: videoUrl }
      });

      // Redirect to learning page immediately (video will process in background)
      router.push(`/learn/${response.video_id}`);
    } catch (err: any) {
      // Handle credit errors (402) specially
      if (err.response?.status === 402 && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'object' && detail.message) {
          setError(detail.message);
        } else if (typeof detail === 'string') {
          setError(detail);
        } else {
          setError('Insufficient credits to process this video');
        }
      } else {
        setError(err.response?.data?.detail || 'Failed to process video');
      }
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
          Add Video to {projectName}
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
