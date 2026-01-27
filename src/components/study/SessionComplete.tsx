import {
  Trophy,
  Flame,
  Target,
  ArrowRight,
  RotateCcw,
  Clock,
} from "lucide-react";
import type { SessionStats } from "../../types";

interface SessionCompleteProps {
  stats: SessionStats;
  deckName: string;
  currentStreak: number;
  studyTime?: string;
  onGoHome: () => void;
  onStudyAgain: () => void;
}

export function SessionComplete({
  stats,
  deckName,
  currentStreak,
  studyTime,
  onGoHome,
  onStudyAgain,
}: SessionCompleteProps) {
  const totalCards = stats.correct + stats.forgot + stats.easy;
  const accuracy =
    totalCards > 0
      ? Math.round(((stats.correct + stats.easy) / totalCards) * 100)
      : 0;

  // Determine performance message
  let performanceEmoji = "🎉";
  let performanceMessage = "Great job!";
  if (accuracy >= 90) {
    performanceEmoji = "🌟";
    performanceMessage = "Outstanding!";
  } else if (accuracy >= 70) {
    performanceEmoji = "✨";
    performanceMessage = "Well done!";
  } else if (accuracy >= 50) {
    performanceEmoji = "💪";
    performanceMessage = "Keep practicing!";
  } else {
    performanceEmoji = "📚";
    performanceMessage = "Room to grow!";
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      {/* Trophy Icon */}
      <div className="w-20 h-20 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full flex items-center justify-center mb-4 shadow-lg">
        <Trophy className="w-10 h-10 text-yellow-600" />
      </div>

      {/* Completion Message */}
      <h2 className="text-2xl md:text-3xl text-purple-600 font-medium mb-1">
        Session Complete!
      </h2>
      <p className="text-purple-400 text-sm mb-6">{deckName}</p>

      {/* Performance Badge */}
      <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl px-6 py-3 mb-6">
        <p className="text-3xl text-center mb-1">{performanceEmoji}</p>
        <p className="text-purple-600 font-medium text-center">
          {performanceMessage}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-6">
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 text-center border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {accuracy}%
            </span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400">Accuracy</p>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 text-center border-2 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {currentStreak}
            </span>
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Day Streak
          </p>
        </div>

        {studyTime && (
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 text-center border-2 border-pink-200 dark:border-pink-800">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-pink-500" />
              <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {studyTime}
              </span>
            </div>
            <p className="text-xs text-pink-600 dark:text-pink-400">Time</p>
          </div>
        )}
      </div>

      {/* Detailed Stats */}
      <div className="flex gap-4 mb-8 text-sm">
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.easy}</p>
          <p className="text-purple-400 text-xs">🌟 Easy</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.correct}</p>
          <p className="text-blue-400 text-xs">✓ Correct</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-500">{stats.forgot}</p>
          <p className="text-red-400 text-xs">😅 Forgot</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={onStudyAgain}
          className="flex-1 py-3 rounded-xl border-2 border-purple-300 text-purple-600 font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Study Again
        </button>
        <button
          onClick={onGoHome}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-purple-400 text-white font-medium hover:from-pink-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
