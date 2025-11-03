'use client';

import { useState } from 'react';
import { Question, QuizResult } from '@/lib/api';
import { CheckCircle, XCircle, Award, AlertCircle, Loader2 } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface QuizComponentProps {
  questions: Question[];
  quizId: string;
  onSubmit: (answers: Array<{ question_id: string; selected_answer: number; timestamp: number }>) => Promise<void>;
  onSeekTo?: (timestamp: number) => void;
}

export default function QuizComponent({
  questions,
  quizId,
  onSubmit,
  onSeekTo,
}: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      selected_answer: answers[q.id] ?? -1,
      timestamp: 0,
    }));

    // Call the parent's onSubmit which will handle recording attempts and generating report
    setSubmitting(true);
    try {
      await onSubmit(formattedAnswers);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setSubmitting(false);
    }
  };

  const handleReviewSegment = (timestamp: number) => {
    if (onSeekTo) {
      onSeekTo(timestamp);
    }
  };

  // Remove the internal result view since parent handles report display
  const question = questions[currentQuestion];
  const selectedAnswer = answers[question.id];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {question.question_text}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;

            return (
              <button
                key={index}
                onClick={() => handleSelectOption(question.id, index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                } cursor-pointer`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="text-gray-800 dark:text-gray-200">{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {currentQuestion === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={!allAnswered || submitting}
            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : allAnswered ? (
              'Submit Quiz'
            ) : (
              `Answer ${questions.length - Object.keys(answers).length} more question(s)`
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Next Question
          </button>
        )}
      </div>

      {/* Question navigator */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Jump to question:</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(index)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                currentQuestion === index
                  ? 'bg-primary-600 text-white'
                  : answers[q.id] !== undefined
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizResults({
  result,
  onReviewSegment,
}: {
  result: QuizResult;
  onReviewSegment: (timestamp: number) => void;
}) {
  const passed = result.score_percentage >= 70;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      {/* Score */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          {passed ? (
            <Award className="w-16 h-16 text-green-600" />
          ) : (
            <AlertCircle className="w-16 h-16 text-yellow-600" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quiz Complete!
        </h2>
        <div className="text-5xl font-bold text-primary-600 mb-2">
          {result.score_percentage}%
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {result.correct_answers} out of {result.total_questions} correct
        </p>
      </div>

      {/* Results breakdown */}
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-gray-900 dark:text-white">Detailed Results:</h3>
        {result.details.map((detail, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${
              detail.is_correct
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30'
                : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30'
            }`}
          >
            <div className="flex items-start gap-3">
              {detail.is_correct ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white mb-2">
                  {detail.question_text}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {detail.explanation}
                </p>
                {!detail.is_correct && detail.video_segment && (
                  <button
                    onClick={() => onReviewSegment(detail.video_segment!.start_time)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Review segment ({formatTime(detail.video_segment.start_time)} -{' '}
                    {formatTime(detail.video_segment.end_time)})
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weak areas */}
      {result.weak_areas.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Areas to Review:
          </h3>
          <ul className="space-y-2">
            {result.weak_areas.map((segment, index) => (
              <li key={index}>
                <button
                  onClick={() => onReviewSegment(segment.start_time)}
                  className="text-sm text-yellow-700 dark:text-yellow-300 hover:underline"
                >
                  {formatTime(segment.start_time)} - {formatTime(segment.end_time)}:{' '}
                  {segment.text.substring(0, 60)}...
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
