'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Loader2, FileText, ExternalLink, Eye, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import dynamic from 'next/dynamic';

// Dynamically import VideoNotes component to avoid SSR issues with Mermaid
const VideoNotesComponent = dynamic(() => import('@/components/VideoNotes'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  ),
});

interface Note {
  notes_id: string;
  video_id: string;
  video_title: string;
  video_type: string;
  domain: string;
  project_name: string | null;
  notes_title: string;
  created_at: string;
}

interface NoteDetail {
  notes_id: string;
  video_id: string;
  title: string;
  sections: Array<{
    heading: string;
    content: string;
    visualizations?: Array<{
      type: string;
      code: string;
      description?: string;
    }>;
  }>;
  review_questions?: string[];
  created_at: string;
}

export default function NotesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotes();
  }, [user]);

  const loadNotes = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/notes/user/${user.id}/all`);
      setNotes(response.data.notes);
    } catch (err: any) {
      console.error('Failed to load notes:', err);
      setError(err.response?.data?.detail || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (notesId: string) => {
    try {
      setPreviewLoading(true);
      const response = await axios.get(`http://localhost:8000/api/notes/by-id/${notesId}`);
      setSelectedNote(response.data.notes);
    } catch (err: any) {
      console.error('Failed to load note preview:', err);
      alert('Failed to load note preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setSelectedNote(null);
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-white mb-2">Your Notes</h1>
          <p className="text-gray-400 font-light">View and manage your video notes</p>
        </div>

        {/* Notes Table */}
        {notes.length === 0 ? (
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">No Notes Yet</h3>
            <p className="text-gray-500">Generate notes for your videos to see them here</p>
          </div>
        ) : (
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-light text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-light text-gray-400">Video</th>
                    <th className="text-left py-3 px-4 text-sm font-light text-gray-400">Project</th>
                    <th className="text-left py-3 px-4 text-sm font-light text-gray-400">Domain</th>
                    <th className="text-left py-3 px-4 text-sm font-light text-gray-400">Notes Title</th>
                    <th className="text-center py-3 px-4 text-sm font-light text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((note) => (
                    <tr
                      key={note.notes_id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-300 font-light">
                        {new Date(note.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-white font-light">{note.video_title}</span>
                          <span className="text-xs text-gray-500">{note.video_type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 font-light">
                        {note.project_name ? (
                          <div className="flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" />
                            <span>{note.project_name}</span>
                          </div>
                        ) : (
                          'No Project'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full">
                          {note.domain}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-white font-light">
                        {note.notes_title}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handlePreview(note.notes_id)}
                            className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                            disabled={previewLoading}
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                          <button
                            onClick={() => router.push(`/learn/${note.video_id}`)}
                            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {selectedNote && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created: {new Date(selectedNote.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      closePreview();
                      router.push(`/learn/${selectedNote.video_id}`);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
                  >
                    Open Video
                  </button>
                  <button
                    onClick={closePreview}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content with VideoNotes Component */}
              <div className="flex-1 overflow-y-auto">
                <VideoNotesComponent notes={selectedNote} />
              </div>
            </div>
          </div>
        )}

        {/* Preview Loading Overlay */}
        {previewLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="text-white">Loading preview...</span>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
