'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import VideoPlayer from '@/components/VideoPlayer';
import FlashCardModal from '@/components/FlashCardModal';
import QuizComponent from '@/components/QuizComponent';
import LearningReportComponent from '@/components/LearningReport';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { videoApi, questionsApi, quizApi, reportsApi, notesApi, FlashCard, Question, QuizResult, LearningReport, VideoNotes } from '@/lib/api';
import { Loader2, BookOpen, CheckCircle, ArrowLeft, FileText } from 'lucide-react';

// Dynamically import VideoNotes component to avoid SSR issues with Mermaid
const VideoNotesComponent = dynamic(() => import('@/components/VideoNotes'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  ),
});

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const videoId = params.videoId as string;

  // Use authenticated user ID (UUID from Supabase)
  const userId = user?.id || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoData, setVideoData] = useState<any>(null);
  const [flashcards, setFlashcards] = useState<FlashCard[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [currentFlashcard, setCurrentFlashcard] = useState<FlashCard | null>(null);
  const [answeredFlashcards, setAnsweredFlashcards] = useState<Set<string>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<{ quiz_id: string; questions: Question[] } | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [seekTimestamp, setSeekTimestamp] = useState<number | null>(null);
  const [learningReport, setLearningReport] = useState<LearningReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [flashcardLearningEnabled, setFlashcardLearningEnabled] = useState(() => {
    // Load preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flashcard_learning_enabled');
      return saved !== null ? saved === 'true' : true; // Default to true
    }
    return true;
  });
  const [videoNotes, setVideoNotes] = useState<VideoNotes | null>(null);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('completed');
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [missedFlashcards, setMissedFlashcards] = useState<FlashCard[]>([]);
  const [showMissedFlashcards, setShowMissedFlashcards] = useState(false);
  const [currentMissedIndex, setCurrentMissedIndex] = useState(0);
  const [batchCurrent, setBatchCurrent] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);

  useEffect(() => {
    loadVideo();
  }, [videoId]);

  // Poll for processing status if not completed
  useEffect(() => {
    if (processingStatus && processingStatus !== 'completed' && processingStatus !== 'failed') {
      const interval = setInterval(async () => {
        try {
          const status = await videoApi.getVideoStatus(videoId);
          setProcessingStatus(status.processing_status);
          setBatchCurrent(status.batch_current || 0);
          setBatchTotal(status.batch_total || 0);

          // For batch processing, reload flashcards continuously as new ones are generated
          const isBatchProcessing = status.processing_status?.includes('batch') || (status.batch_total > 0);

          if (isBatchProcessing) {
            // Reload flashcards during batch processing to show new ones as they arrive
            await loadFlashcardsOnly();
          } else if (status.processing_status === 'completed') {
            // Load flashcards when completed (without reloading page)
            await loadFlashcardsOnly();
          }
        } catch (err) {
          console.error('Failed to fetch processing status:', err);
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [processingStatus, videoId]);

  useEffect(() => {
    // Check if any flashcard should be shown at current time
    // Only show flashcards if flashcard learning is enabled
    if (!showFlashcard && flashcards.length > 0 && flashcardLearningEnabled) {
      const flashcardToShow = flashcards.find(
        (fc) =>
          Math.abs(fc.show_at_timestamp - currentTime) < 2 &&
          !answeredFlashcards.has(fc.question.id)
      );

      if (flashcardToShow) {
        setCurrentFlashcard(flashcardToShow);
        setShowFlashcard(true);
      }
    }
  }, [currentTime, flashcards, showFlashcard, answeredFlashcards, flashcardLearningEnabled]);

  // Check if video ended and show missed flashcards
  useEffect(() => {
    if (videoData && currentTime > 0 && Math.abs(currentTime - videoData.duration) < 2) {
      // Video ended - check for missed flashcards
      if (missedFlashcards.length > 0 && !showMissedFlashcards) {
        setShowMissedFlashcards(true);
        setCurrentMissedIndex(0);
      }
    }
  }, [currentTime, videoData, missedFlashcards, showMissedFlashcards]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      const data = await videoApi.getVideo(videoId);
      setVideoData(data);

      // Set processing status
      setProcessingStatus(data.processing_status || 'completed');

      // Parse flashcards from questions
      if (data.processing_status === 'completed' || data.processing_status === 'generating_flashcards') {
        setFlashcardsLoading(data.processing_status === 'generating_flashcards');
        const questionsData = await questionsApi.getFlashcards(videoId);
        setFlashcards(questionsData.flashcards || []);
        setFlashcardsLoading(false);
      } else {
        setFlashcardsLoading(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  // Load flashcards only without reloading the page (for background updates)
  const loadFlashcardsOnly = async () => {
    try {
      setFlashcardsLoading(true);
      const questionsData = await questionsApi.getFlashcards(videoId);
      const newFlashcards = questionsData.flashcards || [];
      setFlashcards(newFlashcards);

      // Detect missed flashcards (generated after user passed their timestamp)
      const missed = newFlashcards.filter(
        fc => fc.show_at_timestamp < currentTime && !answeredFlashcards.has(fc.question.id)
      );

      if (missed.length > 0) {
        setMissedFlashcards(missed);
        console.log(`Detected ${missed.length} missed flashcards`);
      }

      setFlashcardsLoading(false);
    } catch (err: any) {
      console.error('Failed to load flashcards:', err);
      setFlashcardsLoading(false);
    }
  };

  const handleFlashcardAnswer = async (questionId: string, selectedAnswer: number) => {
    setAnsweredFlashcards((prev) => new Set([...prev, questionId]));

    // Record the attempt in the database
    if (currentFlashcard) {
      try {
        await reportsApi.recordAttempt(
          userId,
          videoId,
          questionId,
          'flashcard',
          selectedAnswer,
          currentFlashcard.question.correct_answer,
          currentTime
        );
      } catch (err) {
        console.error('Failed to record flashcard attempt:', err);
      }
    }
  };

  const handleCloseFlashcard = () => {
    setShowFlashcard(false);
    setCurrentFlashcard(null);
  };

  const handleStartQuiz = async () => {
    try {
      const quiz = await quizApi.generateQuiz(videoId);
      setQuizData(quiz);
      setShowQuiz(true);
    } catch (err: any) {
      alert('Failed to generate quiz');
    }
  };

  const handleSubmitQuiz = async (
    answers: Array<{ question_id: string; selected_answer: number; timestamp: number }>
  ) => {
    if (!quizData) return;

    try {
      // Record all quiz attempts
      for (const answer of answers) {
        const question = quizData.questions.find(q => q.id === answer.question_id);
        if (question) {
          await reportsApi.recordAttempt(
            userId,
            videoId,
            answer.question_id,
            'quiz',
            answer.selected_answer,
            question.correct_answer,
            answer.timestamp
          );
        }
      }

      // Submit quiz to get results
      const result = await quizApi.submitQuiz(quizData.quiz_id, answers);
      setQuizResult(result);

      // Generate learning report
      setGeneratingReport(true);
      try {
        const reportResponse = await reportsApi.generateReport(userId, videoId, quizData.quiz_id);
        setLearningReport(reportResponse.report);
      } catch (err) {
        console.error('Failed to generate report:', err);
      } finally {
        setGeneratingReport(false);
      }
    } catch (err: any) {
      alert('Failed to submit quiz');
      console.error('Quiz submission error:', err);
    }
  };

  const handleSeekTo = (timestamp: number) => {
    setSeekTimestamp(timestamp);
    setShowFlashcard(false);
    setShowQuiz(false);
  };

  const handleToggleFlashcardLearning = () => {
    const newValue = !flashcardLearningEnabled;
    setFlashcardLearningEnabled(newValue);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('flashcard_learning_enabled', String(newValue));
    }
  };

  const handleGenerateNotes = async () => {
    try {
      setGeneratingNotes(true);
      const response = await notesApi.generateNotes(videoId, userId);
      setVideoNotes(response.notes);
      setShowNotes(true);
    } catch (err: any) {
      console.error('Failed to generate notes:', err);

      // Handle credit errors (402) specially
      let errorMsg = 'Failed to generate notes. Please try again.';
      if (err.response?.status === 402 && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'object' && detail.message) {
          errorMsg = detail.message;
        } else if (typeof detail === 'string') {
          errorMsg = detail;
        } else {
          errorMsg = 'Insufficient credits to generate notes for this video';
        }
      }

      alert(errorMsg);
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleMissedFlashcardAnswer = async (questionId: string, selectedAnswer: number) => {
    const currentCard = missedFlashcards[currentMissedIndex];

    // Mark as answered
    setAnsweredFlashcards((prev) => new Set([...prev, questionId]));

    // Record the attempt
    if (currentCard) {
      try {
        await reportsApi.recordAttempt(
          userId,
          videoId,
          questionId,
          'flashcard',
          selectedAnswer,
          currentCard.question.correct_answer,
          currentCard.show_at_timestamp
        );
      } catch (err) {
        console.error('Failed to record missed flashcard attempt:', err);
      }
    }

    // Move to next missed flashcard or close
    if (currentMissedIndex < missedFlashcards.length - 1) {
      setCurrentMissedIndex(currentMissedIndex + 1);
    } else {
      setShowMissedFlashcards(false);
      setMissedFlashcards([]);
      setCurrentMissedIndex(0);
    }
  };

  const handleSkipMissedFlashcards = () => {
    setShowMissedFlashcards(false);
    setMissedFlashcards([]);
    setCurrentMissedIndex(0);
  };

  const handleShowNotes = async () => {
    // Try to fetch existing notes first
    if (!videoNotes) {
      try {
        const response = await notesApi.getNotes(videoId);
        setVideoNotes(response.notes);
      } catch (err) {
        // Notes don't exist yet, that's okay
        console.log('No existing notes found');
      }
    }
    setShowNotes(true);
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading video...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-emerald-400 hover:text-emerald-300 font-light"
            >
              Go back to Dashboard
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-light">Back to Projects</span>
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-light text-white mb-3">
                {videoData?.title}
              </h1>
              <div className="flex items-center gap-6 text-sm text-gray-400 font-light">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  {answeredFlashcards.size} / {flashcards.length} flashcards completed
                </span>
              </div>
            </div>

            {/* Flashcard Learning Toggle */}
            <div className="flex items-center gap-3 bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-light text-white">Flashcard Learning</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {flashcardLearningEnabled ? 'Auto-pause enabled' : 'Disabled'}
                </p>
              </div>
              <button
                onClick={handleToggleFlashcardLearning}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black ${
                  flashcardLearningEnabled ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
                role="switch"
                aria-checked={flashcardLearningEnabled}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    flashcardLearningEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-3">
            {/* Video Player with Dark Theme */}
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <VideoPlayer
                videoUrl={videoData?.url}
                onTimeUpdate={setCurrentTime}
                seekTo={seekTimestamp}
                shouldPause={showFlashcard}
              />
            </div>

            {/* Quiz Section */}
            {showQuiz && quizData && !learningReport ? (
              <div className="mt-8">
                <QuizComponent
                  questions={quizData.questions}
                  quizId={quizData.quiz_id}
                  onSubmit={handleSubmitQuiz}
                  onSeekTo={handleSeekTo}
                />
                {generatingReport && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <p className="text-blue-800 dark:text-blue-200">
                        Generating your learning report...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : learningReport ? (
              <div className="mt-8">
                <LearningReportComponent report={learningReport} />
              </div>
            ) : (
              !showQuiz &&
              answeredFlashcards.size === flashcards.length &&
              flashcards.length > 0 && (
                <div className="mt-8 bg-gradient-to-b from-gray-900 to-black border border-emerald-500/30 rounded-2xl p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-light text-white mb-3">
                    Great job!
                  </h2>
                  <p className="text-gray-400 font-light mb-6 max-w-md mx-auto">
                    You've completed all flashcards. Ready to test your knowledge with a final quiz?
                  </p>
                  <button
                    onClick={handleStartQuiz}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-light py-3 px-8 rounded-xl transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <BookOpen className="w-5 h-5" />
                    Start Final Quiz
                  </button>
                </div>
              )
            )}
          </div>

          {/* Timeline Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Timeline Card */}
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-5 sticky top-8 shadow-xl">
              {/* Timeline Heading */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-800"></div>
                <h2 className="text-sm font-light text-gray-400 uppercase tracking-wider">
                  Timeline
                </h2>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-800"></div>
              </div>

              {/* Tree Timeline */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto px-2 scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700">
                <div className="relative">
                  {/* Gray background line (full length) */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gray-800 z-0"></div>

                  {/* Emerald progress line (dynamic based on progress) */}
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 top-0 w-0.5 bg-emerald-500 z-0 transition-all duration-300 shadow-lg shadow-emerald-500/50"
                    style={{
                      height: `${flashcards.length > 0 ? (answeredFlashcards.size / flashcards.length) * 100 : 0}%`
                    }}
                  ></div>

                  {/* Timeline items */}
                  <div className="space-y-6">
                    {[...flashcards]
                      .sort((a, b) => a.show_at_timestamp - b.show_at_timestamp)
                      .map((fc, index) => {
                      const isAnswered = answeredFlashcards.has(fc.question.id);
                      const isPast = currentTime > fc.show_at_timestamp;
                      const isCurrent = Math.abs(currentTime - fc.show_at_timestamp) < 2;
                      const isLeft = index % 2 === 0;

                      // Truncate question text for short takeaway
                      const takeaway = fc.question.question_text.length > 60
                        ? fc.question.question_text.substring(0, 60) + '...'
                        : fc.question.question_text;

                      return (
                        <div
                          key={fc.question.id}
                          className={`relative flex items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
                        >
                          {/* Left side content */}
                          {isLeft && (
                            <div className="w-[calc(50%-20px)] pr-3 text-right">
                              <div className={`text-[10px] font-light mb-1 ${
                                isAnswered
                                  ? 'text-emerald-400'
                                  : isCurrent
                                  ? 'text-yellow-400'
                                  : 'text-gray-600'
                              }`}>
                                {Math.floor(fc.show_at_timestamp / 60)}:
                                {Math.floor(fc.show_at_timestamp % 60).toString().padStart(2, '0')}
                              </div>
                              <p className={`text-[9px] leading-tight font-light ${
                                isAnswered
                                  ? 'text-gray-400'
                                  : 'text-gray-600'
                              }`}>
                                {takeaway}
                              </p>
                            </div>
                          )}

                          {/* Center circle */}
                          <div className="relative z-10 flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-light text-xs transition-all ${
                              isAnswered
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                                : isCurrent
                                ? 'bg-yellow-400 border-yellow-400 text-gray-900 animate-pulse shadow-lg shadow-yellow-400/50'
                                : isPast
                                ? 'bg-yellow-400/50 border-yellow-400/50 text-gray-900 shadow-md'
                                : 'bg-gray-800 border-gray-700 text-gray-400 shadow-sm'
                            }`}>
                              {isAnswered ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                index + 1
                              )}
                            </div>
                          </div>

                          {/* Right side content */}
                          {!isLeft && (
                            <div className="w-[calc(50%-20px)] pl-3 text-left">
                              <div className={`text-[10px] font-light mb-1 ${
                                isAnswered
                                  ? 'text-emerald-400'
                                  : isCurrent
                                  ? 'text-yellow-400'
                                  : 'text-gray-600'
                              }`}>
                                {Math.floor(fc.show_at_timestamp / 60)}:
                                {Math.floor(fc.show_at_timestamp % 60).toString().padStart(2, '0')}
                              </div>
                              <p className={`text-[9px] leading-tight font-light ${
                                isAnswered
                                  ? 'text-gray-400'
                                  : 'text-gray-600'
                              }`}>
                                {takeaway}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quiz Button */}
              {answeredFlashcards.size === flashcards.length && flashcards.length > 0 && (
                <button
                  onClick={handleStartQuiz}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-light py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
                >
                  <BookOpen className="w-4 h-4" />
                  Take Quiz
                </button>
              )}
            </div>

            {/* Generate Notes Card */}
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-4 shadow-xl">
              {/* Generate Notes Button */}
              {!videoNotes && (
                <button
                  onClick={handleGenerateNotes}
                  disabled={generatingNotes || processingStatus !== 'completed'}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-800 disabled:to-gray-700 disabled:text-gray-500 text-white font-light py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-500/20"
                  title={processingStatus !== 'completed' ? 'Waiting for transcription to complete...' : ''}
                >
                  {generatingNotes ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Notes...
                    </>
                  ) : processingStatus !== 'completed' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {batchTotal > 0 ? (
                        // Batch processing
                        <>
                          {processingStatus.includes('transcribing') && `Transcribing batch ${batchCurrent}/${batchTotal}...`}
                          {processingStatus.includes('generating_flashcards') && `Generating flashcards ${batchCurrent}/${batchTotal}...`}
                          {!processingStatus.includes('transcribing') && !processingStatus.includes('generating_flashcards') &&
                            `Processing batch ${batchCurrent}/${batchTotal}...`}
                        </>
                      ) : (
                        // Standard processing
                        <>
                          {processingStatus === 'transcribing' && 'Transcribing video...'}
                          {processingStatus === 'generating_flashcards' && 'Generating flashcards...'}
                          {processingStatus === 'processing' && 'Processing video...'}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate Notes
                    </>
                  )}
                </button>
              )}

              {/* View Notes Button */}
              {videoNotes && (
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-light py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-500/20"
                >
                  <FileText className="w-4 h-4" />
                  {showNotes ? 'Hide Notes' : 'View Notes'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Notes Display */}
        {showNotes && videoNotes && (
          <div className="mt-8">
            <VideoNotesComponent notes={videoNotes} />
          </div>
        )}
      </div>

      {/* Flashcard Modal */}
      {showFlashcard && currentFlashcard && (
        <FlashCardModal
          flashcard={currentFlashcard}
          onAnswer={handleFlashcardAnswer}
          onClose={handleCloseFlashcard}
          onSeekTo={handleSeekTo}
        />
      )}

      {/* Missed Flashcards Modal */}
      {showMissedFlashcards && missedFlashcards.length > 0 && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black border border-emerald-500/30 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 pointer-events-none rounded-2xl"></div>

            {/* Header */}
            <div className="relative z-10 mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                ⏰ Missed Flashcards
              </h2>
              <p className="text-gray-400 text-sm">
                These flashcards were generated while you were watching. Complete them now!
              </p>
              <p className="text-emerald-400 text-sm mt-2">
                {currentMissedIndex + 1} of {missedFlashcards.length}
              </p>
            </div>

            {/* Current Missed Flashcard */}
            <div className="relative z-10">
              <FlashCardModal
                flashcard={missedFlashcards[currentMissedIndex]}
                onAnswer={handleMissedFlashcardAnswer}
                onClose={handleSkipMissedFlashcards}
                onSeekTo={handleSeekTo}
              />
            </div>

            {/* Skip Button */}
            <div className="relative z-10 mt-6 flex justify-center">
              <button
                onClick={handleSkipMissedFlashcards}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Skip Remaining ({missedFlashcards.length - currentMissedIndex - 1})
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
