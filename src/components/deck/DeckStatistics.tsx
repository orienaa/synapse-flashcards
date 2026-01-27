import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Calendar,
  Award,
  Brain,
  Flame,
} from "lucide-react";
import type { Deck } from "../../types";
import { getDetailedDeckStats } from "../../utils/spacedRepetition";

interface DeckStatisticsProps {
  deck: Deck;
}

export function DeckStatistics({ deck }: DeckStatisticsProps) {
  const stats = getDetailedDeckStats(deck.cards);

  // Calculate mastery percentage
  const masteryPercent =
    stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  // Calculate average ease factor
  const avgEase =
    deck.cards.length > 0
      ? deck.cards.reduce((sum, c) => sum + c.easeFactor, 0) / deck.cards.length
      : 2.5;

  // Calculate total reviews
  const totalReviews = deck.cards.reduce((sum, c) => sum + c.repetitions, 0);

  // Cards by difficulty
  const easyCards = deck.cards.filter((c) => c.easeFactor >= 2.5).length;
  const mediumCards = deck.cards.filter(
    (c) => c.easeFactor >= 2.0 && c.easeFactor < 2.5,
  ).length;
  const hardCards = deck.cards.filter((c) => c.easeFactor < 2.0).length;

  // Calculate study consistency (cards reviewed in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyReviewed = deck.cards.filter(
    (c) => c.lastReview && new Date(c.lastReview) >= sevenDaysAgo,
  ).length;

  return (
    <div className="space-y-4 p-1">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">
            {stats.total}
          </p>
          <p className="text-xs text-purple-500 dark:text-purple-400">
            Total Cards
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Award className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-300">
            {masteryPercent}%
          </p>
          <p className="text-xs text-green-500 dark:text-green-400">Mastered</p>
        </div>

        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Brain className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
            {totalReviews}
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-400">
            Total Reviews
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-300">
            {((avgEase / 2.5) * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-orange-500 dark:text-orange-400">
            Avg. Ease
          </p>
        </div>
      </div>

      {/* Mastery Progress */}
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4">
        <h3 className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Mastery Progress
        </h3>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
          <div
            className="bg-green-400 dark:bg-green-500 transition-all"
            style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
            title={`Mastered: ${stats.mastered}`}
          />
          <div
            className="bg-blue-400 dark:bg-blue-500 transition-all"
            style={{ width: `${(stats.learning / stats.total) * 100}%` }}
            title={`Learning: ${stats.learning}`}
          />
          <div
            className="bg-orange-400 dark:bg-orange-500 transition-all"
            style={{ width: `${(stats.new / stats.total) * 100}%` }}
            title={`New: ${stats.new}`}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-green-600 dark:text-green-400">
              Mastered ({stats.mastered})
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-blue-600 dark:text-blue-400">
              Learning ({stats.learning})
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-400 rounded-full" />
            <span className="text-orange-600 dark:text-orange-400">
              New ({stats.new})
            </span>
          </span>
        </div>
      </div>

      {/* Difficulty Distribution */}
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4">
        <h3 className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4" />
          Difficulty Distribution
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs w-16 text-green-600 dark:text-green-400">
              Easy
            </span>
            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400"
                style={{
                  width: `${stats.total > 0 ? (easyCards / stats.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs w-8 text-right text-gray-500">
              {easyCards}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-16 text-yellow-600 dark:text-yellow-400">
              Medium
            </span>
            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400"
                style={{
                  width: `${stats.total > 0 ? (mediumCards / stats.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs w-8 text-right text-gray-500">
              {mediumCards}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-16 text-red-600 dark:text-red-400">
              Hard
            </span>
            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-400"
                style={{
                  width: `${stats.total > 0 ? (hardCards / stats.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs w-8 text-right text-gray-500">
              {hardCards}
            </span>
          </div>
        </div>
      </div>

      {/* Review Schedule */}
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4">
        <h3 className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Upcoming Reviews
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-2">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {stats.cardsByStatus.overdue.length}
            </p>
            <p className="text-xs text-red-500">Overdue</p>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/30 rounded-lg p-2">
            <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
              {stats.cardsByStatus.dueToday.length}
            </p>
            <p className="text-xs text-pink-500">Today</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-2">
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {stats.cardsByStatus.dueTomorrow.length}
            </p>
            <p className="text-xs text-orange-500">Tomorrow</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-2">
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {stats.cardsByStatus.dueThisWeek.length}
            </p>
            <p className="text-xs text-yellow-600">This Week</p>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4">
        <h3 className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Activity
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">
              {recentlyReviewed}
            </p>
            <p className="text-xs text-purple-500 dark:text-purple-400">
              Cards reviewed in last 7 days
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-purple-600 dark:text-purple-300">
              {stats.strugglingCards.length > 0 && (
                <span className="text-red-500">
                  🔥 {stats.strugglingCards.length} struggling
                </span>
              )}
              {stats.strugglingCards.length === 0 && (
                <span className="text-green-500">✨ All good!</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
