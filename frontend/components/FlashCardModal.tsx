'use client';

import { useState } from 'react';
import { FlashCard, Question } from '@/lib/api';
import { X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface FlashCardModalProps {
  flashcard: FlashCard;
  onAnswer: (questionId: string, selectedAnswer: number) => void;
  onClose: () => void;
  onSeekTo?: (timestamp: number) => void;
}

export default function FlashCardModal({
  flashcard,
  onAnswer,
  onClose,
  onSeekTo,
}: FlashCardModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (selectedOption === null) return;

    const correct = selectedOption === flashcard.question.correct_answer;
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(flashcard.question.id, selectedOption);
  };

  const handleReviewSegment = () => {
    if (onSeekTo && flashcard.question.video_segment) {
      onSeekTo(flashcard.question.video_segment.start_time);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-primary-600 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Quick Check</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test Your Understanding
          </h2>
        </div>

        {/* Question */}
        <div className="mb-6">
          <p className="text-lg text-gray-800 dark:text-gray-200 mb-4">
            {flashcard.question.question_text}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {flashcard.question.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrectAnswer = index === flashcard.question.correct_answer;
              const showCorrect = submitted && isCorrectAnswer;
              const showWrong = submitted && isSelected && !isCorrectAnswer;

              return (
                <button
                  key={index}
                  onClick={() => !submitted && setSelectedOption(index)}
                  disabled={submitted}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                      : showWrong
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                      : isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800 dark:text-gray-200">{option}</span>
                    {showCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {showWrong && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation (shown after submission) */}
        {submitted && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              isCorrect
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h3
                  className={`font-semibold mb-2 ${
                    isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {isCorrect ? 'Correct!' : 'Not quite right'}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {flashcard.question.explanation}
                </p>
              </div>
            </div>

            {/* Review segment button for incorrect answers */}
            {!isCorrect && flashcard.question.video_segment && (
              <button
                onClick={handleReviewSegment}
                className="mt-4 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Review Video Segment ({formatTime(flashcard.question.video_segment.start_time)} -{' '}
                {formatTime(flashcard.question.video_segment.end_time)})
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!submitted ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Submit Answer
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Continue Learning
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
