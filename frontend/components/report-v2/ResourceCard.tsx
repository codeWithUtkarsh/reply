'use client';

import { FileText, BarChart3, RefreshCw, Play } from 'lucide-react';

interface ResourceCardProps {
  hasNotes: boolean;
  hasQuizReport: boolean;
  videoId: string;
  onGenerateNotes?: () => void;
  onViewNotes?: () => void;
  onViewReport?: () => void;
  onRetakeQuiz?: () => void;
}

export default function ResourceCard({
  hasNotes,
  hasQuizReport,
  videoId,
  onGenerateNotes,
  onViewNotes,
  onViewReport,
  onRetakeQuiz
}: ResourceCardProps) {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-700 rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-500/20 p-2 rounded-lg">
          <Play className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-light text-white">Learning Resources</h3>
          <p className="text-sm text-gray-400 font-light">Quick access to your study materials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Notes Action */}
        <button
          onClick={hasNotes ? onViewNotes : onGenerateNotes}
          className="bg-gray-800/50 border border-gray-700 hover:border-emerald-500/50 rounded-lg p-4 transition-all group hover:shadow-lg hover:shadow-emerald-500/10"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-light text-white mb-1">
                {hasNotes ? 'View Notes' : 'Generate Notes'}
              </h4>
              <p className="text-xs text-gray-400 font-light">
                {hasNotes ? 'Access your study notes' : 'AI-powered notes from video'}
              </p>
            </div>
          </div>
        </button>

        {/* Quiz Report Action */}
        <button
          onClick={onViewReport}
          disabled={!hasQuizReport}
          className={`bg-gray-800/50 border rounded-lg p-4 transition-all group ${
            hasQuizReport
              ? 'border-gray-700 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer'
              : 'border-gray-800 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className={`border p-3 rounded-lg transition-colors ${
              hasQuizReport
                ? 'bg-purple-500/20 border-purple-500/30 group-hover:bg-purple-500/30'
                : 'bg-gray-700/20 border-gray-700/30'
            }`}>
              <BarChart3 className={`w-6 h-6 ${hasQuizReport ? 'text-purple-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <h4 className={`font-light mb-1 ${hasQuizReport ? 'text-white' : 'text-gray-500'}`}>
                View Quiz Report
              </h4>
              <p className="text-xs text-gray-400 font-light">
                {hasQuizReport ? 'See your performance' : 'Take a quiz first'}
              </p>
            </div>
          </div>
        </button>

        {/* Retake Quiz Action */}
        <button
          onClick={onRetakeQuiz}
          className="bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 rounded-lg p-4 transition-all group hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-blue-500/20 border border-blue-500/30 p-3 rounded-lg group-hover:bg-blue-500/30 transition-colors">
              <RefreshCw className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="font-light text-white mb-1">
                {hasQuizReport ? 'Retake Quiz' : 'Take Quiz'}
              </h4>
              <p className="text-xs text-gray-400 font-light">
                {hasQuizReport ? 'Improve your score' : 'Test your knowledge'}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
