'use client';

import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Flashcard {
  id: string;
  question_data: {
    question: string;
    answer: string;
    options?: string[];
    correct_answer?: number;
  };
}

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: Flashcard[];
}

export default function FlashcardModal({ isOpen, onClose, flashcards }: FlashcardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (!isOpen) return null;

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleFlipCard = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">Close</span>
            <X className="w-6 h-6" />
          </div>
        </button>

        {/* Card Container */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-700 rounded-2xl p-8 shadow-2xl">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                Card {currentIndex + 1} of {flashcards.length}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round(((currentIndex + 1) / flashcards.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Flashcard */}
          <div
            onClick={handleFlipCard}
            className="relative min-h-[300px] cursor-pointer perspective-1000"
          >
            <div
              className={`relative w-full h-full transition-all duration-500 transform-style-3d ${
                showAnswer ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front (Question) */}
              <div
                className={`absolute inset-0 backface-hidden ${
                  showAnswer ? 'invisible' : 'visible'
                }`}
              >
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center">
                  <p className="text-xs text-blue-400 uppercase tracking-wide mb-4">Question</p>
                  <p className="text-xl text-white font-light text-center leading-relaxed">
                    {currentCard?.question_data?.question || 'No question available'}
                  </p>
                  <p className="text-sm text-gray-400 mt-6 italic">Click to reveal answer</p>
                </div>
              </div>

              {/* Back (Answer) */}
              <div
                className={`absolute inset-0 backface-hidden rotate-y-180 ${
                  showAnswer ? 'visible' : 'invisible'
                }`}
              >
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center">
                  <p className="text-xs text-emerald-400 uppercase tracking-wide mb-4">Answer</p>
                  <p className="text-xl text-white font-light text-center leading-relaxed">
                    {currentCard?.question_data?.answer || 'No answer available'}
                  </p>
                  <p className="text-sm text-gray-400 mt-6 italic">Click to see question</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentIndex === 0
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-white hover:bg-gray-800 border border-gray-700'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleFlipCard}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all font-light"
            >
              {showAnswer ? 'Show Question' : 'Show Answer'}
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentIndex === flashcards.length - 1
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-white hover:bg-gray-800 border border-gray-700'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Navigation Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {flashcards.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setShowAnswer(false);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-blue-500 w-8'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
