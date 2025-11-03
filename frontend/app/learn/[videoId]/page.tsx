'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import FlashCardModal from '@/components/FlashCardModal';
import QuizComponent from '@/components/QuizComponent';
import LearningReportComponent from '@/components/LearningReport';
import { videoApi, questionsApi, quizApi, reportsApi, FlashCard, Question, QuizResult, LearningReport } from '@/lib/api';
import { Loader2, BookOpen, CheckCircle, ArrowLeft } from 'lucide-react';

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

  useEffect(() => {
    loadVideo();
  }, [videoId]);

  useEffect(() => {
    // Check if any flashcard should be shown at current time
    if (!showFlashcard && flashcards.length > 0) {
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
  }, [currentTime, flashcards, showFlashcard, answeredFlashcards]);

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
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

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Learning Progress
              </h2>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Flashcards</span>
                  <span>
                    {answeredFlashcards.size}/{flashcards.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        flashcards.length > 0
                          ? (answeredFlashcards.size / flashcards.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Flashcard List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Upcoming Flashcards:
                </h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {flashcards.map((fc, index) => {
                    const isAnswered = answeredFlashcards.has(fc.question.id);
                    const isPast = currentTime > fc.show_at_timestamp;

                    return (
                      <div
                        key={fc.question.id}
                        className={`p-3 rounded-lg text-sm ${
                          isAnswered
                            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                            : isPast
                            ? 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
                            : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            Flashcard {index + 1}
                          </span>
                          {isAnswered && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">
                          Appears at {Math.floor(fc.show_at_timestamp / 60)}:
                          {Math.floor(fc.show_at_timestamp % 60)
                            .toString()
                            .padStart(2, '0')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quiz Button */}
              {answeredFlashcards.size === flashcards.length && flashcards.length > 0 && (
                <button
                  onClick={handleStartQuiz}
                  className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Take Final Quiz
                </button>
              )}
            </div>
          </div>
        </div>
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
