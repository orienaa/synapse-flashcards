import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
  Heart,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { Flashcard, StudyResponse, SessionStats } from "../../types";

interface FlashcardStudyProps {
  cards: Flashcard[];
  currentIndex: number;
  sessionStats: SessionStats;
  onResponse: (response: StudyResponse) => void;
}

// Fisher-Yates shuffle with seed based on card id for consistent shuffling per card
function shuffleWithSeed(
  array: string[],
  seed: string,
): { shuffled: string[]; originalIndices: number[] } {
  const shuffled = [...array];
  const originalIndices = array.map((_, i) => i);

  // Simple hash function for seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }

  // Seeded random function
  const random = () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };

  // Shuffle both arrays together
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    [originalIndices[i], originalIndices[j]] = [
      originalIndices[j],
      originalIndices[i],
    ];
  }

  return { shuffled, originalIndices };
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

  // Shuffle options for multiple choice cards
  const shuffledOptions = useMemo(() => {
    if (!currentCard?.options || currentCard.options.length === 0) {
      return null;
    }

    const { shuffled, originalIndices } = shuffleWithSeed(
      currentCard.options,
      currentCard.id + currentIndex.toString(), // Use card id + index for consistent but unique shuffle
    );

    // Find where the correct answer ended up after shuffling
    const newCorrectIndex = originalIndices.findIndex(
      (origIdx) => origIdx === currentCard.correctIndex,
    );

    return {
      options: shuffled,
      correctIndex: newCorrectIndex,
      originalIndices,
    };
  }, [
    currentCard?.id,
    currentCard?.options,
    currentCard?.correctIndex,
    currentIndex,
  ]);

  const isMultipleChoice = shuffledOptions !== null;
  const hasAnswered = selectedOption !== null;
  const isCorrect =
    hasAnswered && selectedOption === shuffledOptions?.correctIndex;

  const handleResponse = useCallback(
    (response: StudyResponse) => {
      setShowAnswer(false);
      setSelectedOption(null);
      onResponse(response);
    },
    [onResponse],
  );

  const handleOptionSelect = useCallback(
    (index: number) => {
      if (selectedOption !== null) return; // Don't allow changing answer
      setSelectedOption(index);
      setShowAnswer(true);
    },
    [selectedOption],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key;

      // Multiple choice: 1-4 or A-D to select options
      if (isMultipleChoice && !hasAnswered && shuffledOptions) {
        const optionCount = shuffledOptions.options.length;
        let optionIndex = -1;

        // Number keys 1-4
        if (key >= "1" && key <= "4") {
          optionIndex = parseInt(key) - 1;
        }
        // Letter keys A-D (case insensitive)
        else if (key.toLowerCase() >= "a" && key.toLowerCase() <= "d") {
          optionIndex = key.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
        }

        if (optionIndex >= 0 && optionIndex < optionCount) {
          handleOptionSelect(optionIndex);
          return;
        }
      }

      // After answering MCQ: Space or Enter to continue
      if (isMultipleChoice && hasAnswered) {
        if (key === " " || key === "Enter") {
          event.preventDefault();
          handleResponse(isCorrect ? "correct" : "forgot");
          return;
        }
      }

      // Regular flashcard (non-MCQ)
      if (!isMultipleChoice) {
        // Space to reveal answer
        if (!showAnswer && key === " ") {
          event.preventDefault();
          setShowAnswer(true);
          return;
        }

        // After revealing: 1/F = Forgot, 2/C = Correct, 3/E = Easy
        if (showAnswer) {
          if (key === "1" || key.toLowerCase() === "f") {
            handleResponse("forgot");
          } else if (key === "2" || key.toLowerCase() === "c" || key === " ") {
            event.preventDefault();
            handleResponse("correct");
          } else if (key === "3" || key.toLowerCase() === "e") {
            handleResponse("easy");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isMultipleChoice,
    hasAnswered,
    showAnswer,
    isCorrect,
    shuffledOptions,
    handleOptionSelect,
    handleResponse,
  ]);

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
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 rounded-2xl border-4 border-pink-200 dark:border-purple-700 p-4 md:p-6 mb-4">
            <Sparkles className="text-purple-400 dark:text-purple-300 w-5 h-5 md:w-6 md:h-6 mb-2" />
            <p className="text-purple-700 dark:text-purple-200 text-base md:text-lg font-medium">
              {currentCard.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {shuffledOptions.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrectOption = index === shuffledOptions.correctIndex;

              let buttonStyle =
                "bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-200";

              if (hasAnswered) {
                if (isCorrectOption) {
                  buttonStyle =
                    "bg-green-100 dark:bg-green-900/50 border-2 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300";
                } else if (isSelected && !isCorrectOption) {
                  buttonStyle =
                    "bg-red-100 dark:bg-red-900/50 border-2 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300";
                } else {
                  buttonStyle =
                    "bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={hasAnswered}
                  className={`w-full p-3 md:p-4 rounded-xl text-left transition-all ${buttonStyle} flex items-center gap-3`}
                >
                  <span className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-purple-200 dark:bg-purple-700 text-purple-600 dark:text-purple-200 flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1 text-sm md:text-base">{option}</span>
                  {hasAnswered && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                  )}
                  {hasAnswered && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Result feedback */}
          {hasAnswered && (
            <div
              className={`mt-4 p-3 rounded-xl text-center ${isCorrect ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"}`}
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

      {/* Keyboard shortcuts hint */}
      <div className="mt-3 text-xs text-purple-300 text-center hidden md:block">
        {isMultipleChoice ? (
          hasAnswered ? (
            <span>
              Press{" "}
              <kbd className="px-1 py-0.5 bg-purple-100 rounded text-purple-500">
                Space
              </kbd>{" "}
              to continue
            </span>
          ) : (
            <span>
              Press{" "}
              <kbd className="px-1 py-0.5 bg-purple-100 rounded text-purple-500">
                1-4
              </kbd>{" "}
              or{" "}
              <kbd className="px-1 py-0.5 bg-purple-100 rounded text-purple-500">
                A-D
              </kbd>{" "}
              to answer
            </span>
          )
        ) : !showAnswer ? (
          <span>
            Press{" "}
            <kbd className="px-1 py-0.5 bg-purple-100 rounded text-purple-500">
              Space
            </kbd>{" "}
            to reveal
          </span>
        ) : (
          <span>
            <kbd className="px-1 py-0.5 bg-purple-100 rounded text-purple-500">
              1
            </kbd>{" "}
            Forgot ·
            <kbd className="px-1 py-0.5 bg-purple-100 rounded text-purple-500 ml-1">
              2
            </kbd>{" "}
            Correct ·
            <kbd className="px-1 py-0.5 bg-purple-100 rounded text-purple-500 ml-1">
              3
            </kbd>{" "}
            Easy
          </span>
        )}
      </div>
    </div>
  );
}
