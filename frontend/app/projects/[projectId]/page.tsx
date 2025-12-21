'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project, Topic } from '@/lib/supabase';
import { topicApi } from '@/lib/api';
import { ArrowLeft, Plus, Loader2, FolderOpen, X, Video } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
      fetchTopics();
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
        router.push('/projects');
      } else {
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const { topics: topicsData } = await topicApi.getTopicsByProject(projectId);
      setTopics(topicsData || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicCreated = () => {
    fetchTopics();
    setShowNewTopicModal(false);
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
              {topics.length} topic{topics.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowNewTopicModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            New Topic
          </button>
        </div>

        {/* Topics List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-light text-white mb-3">
              No topics yet
            </h3>
            <p className="text-gray-400 mb-6 font-light">
              Create your first topic to organize your videos
            </p>
            <button
              onClick={() => setShowNewTopicModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              New Topic
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </div>

      {showNewTopicModal && (
        <NewTopicModal
          projectId={projectId}
          projectName={project.project_name}
          onClose={() => setShowNewTopicModal(false)}
          onTopicCreated={handleTopicCreated}
        />
      )}
    </AuthenticatedLayout>
  );
}

interface TopicCardProps {
  topic: Topic;
}

function TopicCard({ topic }: TopicCardProps) {
  const router = useRouter();
  const [videoCount, setVideoCount] = useState<number>(0);

  useEffect(() => {
    fetchVideoCount();
  }, [topic.id]);

  const fetchVideoCount = async () => {
    try {
      const { videos } = await topicApi.getVideosByTopic(topic.id);
      setVideoCount(videos?.length || 0);
    } catch (error) {
      console.error('Error fetching video count:', error);
    }
  };

  return (
    <div
      onClick={() => router.push(`/topics/${topic.id}`)}
      className="group bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-all">
          <FolderOpen className="w-6 h-6 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-light text-white mb-1 group-hover:text-emerald-400 transition-colors">
            {topic.topic_name}
          </h3>
          {topic.topic_desc && (
            <p className="text-sm text-gray-400 mb-3 font-light line-clamp-2">
              {topic.topic_desc}
            </p>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Video className="w-4 h-4" />
            <span className="font-light">{videoCount} video{videoCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NewTopicModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onTopicCreated: () => void;
}

function NewTopicModal({ projectId, projectName, onClose, onTopicCreated }: NewTopicModalProps) {
  const { user } = useAuth();
  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create topic
      await topicApi.createTopic(topicName, projectId, topicDesc || undefined);

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user!.id,
        project_id: projectId,
        activity_desc: `Created new topic "${topicName}" in project "${projectName}"`,
        activity_type: 'topic_created',
        metadata: { topic_name: topicName }
      });

      onTopicCreated();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create topic');
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
          New Topic
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label
              htmlFor="topicName"
              className="block text-sm font-light text-gray-300 mb-2"
            >
              Topic Name
            </label>
            <input
              type="text"
              id="topicName"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g., Neural Networks, Web Development"
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-black border border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-gray-500 font-light transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="topicDesc"
              className="block text-sm font-light text-gray-300 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="topicDesc"
              value={topicDesc}
              onChange={(e) => setTopicDesc(e.target.value)}
              placeholder="Brief description of this topic..."
              rows={3}
              disabled={loading}
              className="w-full px-4 py-3 bg-black border border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-gray-500 font-light transition-all disabled:opacity-50 resize-none"
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
              disabled={loading || !topicName}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-gray-700 disabled:to-gray-600 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Topic
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
