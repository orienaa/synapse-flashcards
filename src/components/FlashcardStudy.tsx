import { useState } from "react";
import { Sparkles, Heart, RotateCcw } from "lucide-react";
import type { Flashcard, StudyResponse, SessionStats } from "../types";

interface FlashcardStudyProps {
  cards: Flashcard[];
  currentIndex: number;
  sessionStats: SessionStats;
  onResponse: (response: StudyResponse) => void;
}

export function FlashcardStudy({
  cards,
  currentIndex,
  sessionStats,
  onResponse,
}: FlashcardStudyProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const currentCard = cards[currentIndex];
  const progress =
    cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const handleResponse = (response: StudyResponse) => {
    setShowAnswer(false);
    onResponse(response);
  };

  if (!currentCard) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      {/* Progress bar */}
      <div className="w-full max-w-md mb-4 md:mb-6">
        <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="flashcard-container w-full max-w-md h-48 sm:h-56 md:h-64 lg:h-72">
        <div
          className={`flashcard w-full h-full relative ${showAnswer ? "flipped" : ""}`}
        >
          {/* Front - Question */}
          <div className="flashcard-face absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl border-4 border-pink-200 p-4 md:p-6 flex flex-col items-center justify-center">
            <Sparkles className="text-purple-400 w-6 h-6 md:w-8 md:h-8 mb-3 md:mb-4" />
            <p className="text-purple-700 text-base md:text-lg lg:text-xl text-center font-medium">
              {currentCard.question}
            </p>
          </div>

          {/* Back - Answer */}
          <div className="flashcard-face flashcard-back absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl border-4 border-purple-200 p-4 md:p-6 flex flex-col items-center justify-center">
            <Heart className="text-pink-400 fill-pink-400 w-6 h-6 md:w-8 md:h-8 mb-3 md:mb-4" />
            <p className="text-purple-700 text-base md:text-lg lg:text-xl text-center font-medium">
              {currentCard.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 md:mt-8">
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="px-6 md:px-8 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-purple-400 text-white text-sm md:text-base font-medium hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
            Show Answer
          </button>
        ) : (
          <div className="flex gap-2 md:gap-3 flex-wrap justify-center">
            <button
              onClick={() => handleResponse("forgot")}
              className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-red-400 to-pink-400 text-white text-sm md:text-base font-medium hover:from-red-500 hover:to-pink-500 transition-all shadow-lg"
            >
              😅 Forgot
            </button>
            <button
              onClick={() => handleResponse("correct")}
              className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-purple-400 to-blue-400 text-white text-sm md:text-base font-medium hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg"
            >
              ✓ Correct
            </button>
            <button
              onClick={() => handleResponse("easy")}
              className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-green-400 to-teal-400 text-white text-sm md:text-base font-medium hover:from-green-500 hover:to-teal-500 transition-all shadow-lg"
            >
              🌟 Easy
            </button>
          </div>
        )}
      </div>

      {/* Session stats */}
      <div className="mt-4 md:mt-6 flex gap-4 text-sm">
        <span className="text-red-400">😅 {sessionStats.forgot}</span>
        <span className="text-purple-400">✓ {sessionStats.correct}</span>
        <span className="text-green-400">🌟 {sessionStats.easy}</span>
      </div>
    </div>
  );
}
