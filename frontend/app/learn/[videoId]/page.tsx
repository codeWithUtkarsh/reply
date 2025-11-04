'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import FlashCardModal from '@/components/FlashCardModal';
import QuizComponent from '@/components/QuizComponent';
import LearningReportComponent from '@/components/LearningReport';
import VideoNotesComponent from '@/components/VideoNotes';
import { videoApi, questionsApi, quizApi, reportsApi, notesApi, FlashCard, Question, QuizResult, LearningReport, VideoNotes } from '@/lib/api';
import { Loader2, BookOpen, CheckCircle, ArrowLeft, FileText } from 'lucide-react';

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.videoId as string;

  // Generate a simple user ID (in production, use actual auth)
  const [userId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('preply_user_id');
      if (!id) {
        id = `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('preply_user_id', id);
      }
      return id;
    }
    return 'anonymous';
  });

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

  useEffect(() => {
    loadVideo();
  }, [videoId]);

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

  const loadVideo = async () => {
    try {
      setLoading(true);
      const data = await videoApi.getVideo(videoId);
      setVideoData(data);

      // Parse flashcards from questions
      const questionsData = await questionsApi.getFlashcards(videoId);
      setFlashcards(questionsData.flashcards || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load video');
    } finally {
      setLoading(false);
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
      const response = await notesApi.generateNotes(videoId);
      setVideoNotes(response.notes);
      setShowNotes(true);
    } catch (err: any) {
      console.error('Failed to generate notes:', err);
      alert('Failed to generate notes. Please try again.');
    } finally {
      setGeneratingNotes(false);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {videoData?.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              {answeredFlashcards.size} / {flashcards.length} flashcards completed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player - Theater View */}
          <div className="lg:col-span-3">
            <VideoPlayer
              videoUrl={videoData?.url}
              onTimeUpdate={setCurrentTime}
              seekTo={seekTimestamp}
              shouldPause={showFlashcard}
            />

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
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Great job!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You've completed all flashcards. Ready to test your knowledge with a final
                    quiz?
                  </p>
                  <button
                    onClick={handleStartQuiz}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    Start Final Quiz
                  </button>
                </div>
              )
            )}
          </div>

          {/* Tree Timeline Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Flashcard Learning Toggle - Separate Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Flashcard Learning
                </span>
                <button
                  onClick={handleToggleFlashcardLearning}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    flashcardLearningEnabled
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={flashcardLearningEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      flashcardLearningEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                {flashcardLearningEnabled
                  ? 'Flashcards will appear during video'
                  : 'Watch without interruptions'}
              </p>
            </div>

            {/* Timeline Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sticky top-8">
              {/* Timeline Heading */}
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                Timeline
              </h2>

              {/* Tree Timeline */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto px-2">
                <div className="relative">
                  {/* Gray background line (full length) */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600 z-0"></div>

                  {/* Green progress line (dynamic based on progress) */}
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 top-0 w-0.5 bg-green-500 z-0 transition-all duration-300"
                    style={{
                      height: `${flashcards.length > 0 ? (answeredFlashcards.size / flashcards.length) * 100 : 0}%`
                    }}
                  ></div>

                  {/* Timeline items */}
                  <div className="space-y-6">
                    {flashcards.map((fc, index) => {
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
                              <div className={`text-[10px] font-semibold mb-1 ${
                                isAnswered
                                  ? 'text-green-600 dark:text-green-400'
                                  : isCurrent
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {Math.floor(fc.show_at_timestamp / 60)}:
                                {Math.floor(fc.show_at_timestamp % 60).toString().padStart(2, '0')}
                              </div>
                              <p className={`text-[9px] leading-tight ${
                                isAnswered
                                  ? 'text-gray-700 dark:text-gray-300'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {takeaway}
                              </p>
                            </div>
                          )}

                          {/* Center circle */}
                          <div className="relative z-10 flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                              isAnswered
                                ? 'bg-green-500 border-green-500 text-white shadow-md'
                                : isCurrent
                                ? 'bg-yellow-400 border-yellow-400 text-gray-900 animate-pulse shadow-lg'
                                : isPast
                                ? 'bg-yellow-400 border-yellow-400 text-gray-900 shadow-md'
                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300 shadow-sm'
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
                              <div className={`text-[10px] font-semibold mb-1 ${
                                isAnswered
                                  ? 'text-green-600 dark:text-green-400'
                                  : isCurrent
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {Math.floor(fc.show_at_timestamp / 60)}:
                                {Math.floor(fc.show_at_timestamp % 60).toString().padStart(2, '0')}
                              </div>
                              <p className={`text-[9px] leading-tight ${
                                isAnswered
                                  ? 'text-gray-700 dark:text-gray-300'
                                  : 'text-gray-500 dark:text-gray-400'
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
                  className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Quiz
                </button>
              )}

              {/* Generate Notes Button */}
              {!videoNotes && (
                <button
                  onClick={handleGenerateNotes}
                  disabled={generatingNotes}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {generatingNotes ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
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
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
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
    </div>
  );
}
