'use client';

import { X } from 'lucide-react';
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
  // Track flipped state for each card independently
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const toggleCard = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-7xl my-8">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light text-white">
            All Flashcards ({flashcards.length})
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">Close</span>
              <X className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Grid of Flashcards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {flashcards.map((card, index) => {
            const isFlipped = flippedCards.has(index);

            return (
              <div key={card.id} className="perspective-1000">
                <div
                  className={`relative w-full h-64 transition-all duration-500 transform-style-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Front (Question) */}
                  <div
                    className={`absolute inset-0 backface-hidden ${
                      isFlipped ? 'invisible' : 'visible'
                    }`}
                  >
                    <div className="bg-gradient-to-b from-gray-900 to-black border border-blue-500/30 rounded-xl p-4 h-full flex flex-col">
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <p className="text-xs text-blue-400 uppercase tracking-wide mb-3">
                          Flashcard {index + 1}
                        </p>
                        <p className="text-sm text-white font-light text-center leading-relaxed">
                          {card.question_data?.question || 'No question available'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleCard(index)}
                        className="mt-4 w-full py-2 px-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-lg text-sm transition-all"
                      >
                        Show Answer
                      </button>
                    </div>
                  </div>

                  {/* Back (Answer) */}
                  <div
                    className={`absolute inset-0 backface-hidden rotate-y-180 ${
                      isFlipped ? 'visible' : 'invisible'
                    }`}
                  >
                    <div className="bg-gradient-to-b from-gray-900 to-black border border-emerald-500/30 rounded-xl p-4 h-full flex flex-col">
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <p className="text-xs text-emerald-400 uppercase tracking-wide mb-3">
                          Answer
                        </p>
                        <p className="text-sm text-white font-light text-center leading-relaxed">
                          {card.question_data?.answer || 'No answer available'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleCard(index)}
                        className="mt-4 w-full py-2 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg text-sm transition-all"
                      >
                        Show Question
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
