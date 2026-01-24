import { useState } from "react";
import {
  Sparkles,
  Heart,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const currentCard = cards[currentIndex];
  const progress =
    cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const isMultipleChoice =
    currentCard?.options && currentCard.options.length > 0;
  const hasAnswered = selectedOption !== null;
  const isCorrect = hasAnswered && selectedOption === currentCard?.correctIndex;

  const handleResponse = (response: StudyResponse) => {
    setShowAnswer(false);
    setSelectedOption(null);
    onResponse(response);
  };

  const handleOptionSelect = (index: number) => {
    if (hasAnswered) return; // Don't allow changing answer
    setSelectedOption(index);
    setShowAnswer(true);
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
      {isMultipleChoice ? (
        // Multiple Choice Card
        <div className="w-full max-w-md">
          {/* Question */}
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl border-4 border-pink-200 p-4 md:p-6 mb-4">
            <Sparkles className="text-purple-400 w-5 h-5 md:w-6 md:h-6 mb-2" />
            <p className="text-purple-700 text-base md:text-lg font-medium">
              {currentCard.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentCard.options!.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrectOption = index === currentCard.correctIndex;

              let buttonStyle =
                "bg-white border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50";

              if (hasAnswered) {
                if (isCorrectOption) {
                  buttonStyle =
                    "bg-green-100 border-2 border-green-400 text-green-700";
                } else if (isSelected && !isCorrectOption) {
                  buttonStyle =
                    "bg-red-100 border-2 border-red-400 text-red-700";
                } else {
                  buttonStyle =
                    "bg-gray-50 border-2 border-gray-200 text-gray-400";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={hasAnswered}
                  className={`w-full p-3 md:p-4 rounded-xl text-left transition-all ${buttonStyle} flex items-center gap-3`}
                >
                  <span className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-purple-200 text-purple-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1 text-sm md:text-base">{option}</span>
                  {hasAnswered && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  {hasAnswered && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Result feedback */}
          {hasAnswered && (
            <div
              className={`mt-4 p-3 rounded-xl text-center ${isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {isCorrect
                ? "🎉 Correct!"
                : `😅 The answer was: ${currentCard.answer}`}
            </div>
          )}
        </div>
      ) : (
        // Regular Flashcard (reveal style - question stays visible, answer appears below)
        <div className="w-full max-w-md">
          {/* Question - always visible */}
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl border-4 border-pink-200 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-purple-400 w-4 h-4" />
              <span className="text-purple-400 text-xs font-medium uppercase tracking-wide">
                Question
              </span>
            </div>
            <p className="text-purple-700 text-base md:text-lg lg:text-xl text-center font-medium">
              {currentCard.question}
            </p>
          </div>

          {/* Answer - revealed when showAnswer is true */}
          {showAnswer && (
            <div className="mt-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl border-4 border-purple-200 p-4 md:p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="text-pink-400 fill-pink-400 w-4 h-4" />
                <span className="text-pink-400 text-xs font-medium uppercase tracking-wide">
                  Answer
                </span>
              </div>
              <p className="text-purple-700 text-base md:text-lg lg:text-xl text-center font-medium">
                {currentCard.answer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="mt-6 md:mt-8">
        {!showAnswer && !isMultipleChoice ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="px-6 md:px-8 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-purple-400 text-white text-sm md:text-base font-medium hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
            Show Answer
          </button>
        ) : showAnswer ? (
          <div className="flex gap-2 md:gap-3 flex-wrap justify-center">
            {isMultipleChoice ? (
              // For multiple choice, auto-determine response based on answer
              <button
                onClick={() => handleResponse(isCorrect ? "correct" : "forgot")}
                className={`px-6 md:px-8 py-3 rounded-xl text-white text-sm md:text-base font-medium transition-all shadow-lg ${
                  isCorrect
                    ? "bg-gradient-to-r from-green-400 to-teal-400 hover:from-green-500 hover:to-teal-500"
                    : "bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500"
                }`}
              >
                {isCorrect ? "🌟 Continue" : "📚 Continue"}
              </button>
            ) : (
              // Regular flashcard - user self-reports
              <>
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
              </>
            )}
          </div>
        ) : null}
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
