import { Trash2, BookOpen, Brain } from "lucide-react";
import type { Deck } from "../types";
import { getDetailedDeckStats } from "../utils/spacedRepetition";

interface DeckCardProps {
  deck: Deck;
  onDelete: (id: string) => void;
  onView: (deck: Deck) => void;
  onStudy: (deck: Deck) => void;
}

export function DeckCard({ deck, onDelete, onView, onStudy }: DeckCardProps) {
  const stats = getDetailedDeckStats(deck.cards);
  const dueCount =
    stats.cardsByStatus.overdue.length + stats.cardsByStatus.dueToday.length;
  const progressPercent =
    stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-3 md:p-4 border-2 border-pink-200 hover:border-purple-300 transition-all">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm md:text-base text-purple-600 font-medium truncate flex-1">
          {deck.name}
        </h3>
        <button
          onClick={() => onDelete(deck.id)}
          className="p-1 text-pink-400 hover:text-pink-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden flex">
          <div
            className="bg-green-400 transition-all"
            style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
          />
          <div
            className="bg-blue-400 transition-all"
            style={{ width: `${(stats.learning / stats.total) * 100}%` }}
          />
          <div
            className="bg-orange-400 transition-all"
            style={{ width: `${(stats.new / stats.total) * 100}%` }}
          />
        </div>
        <p className="text-xs text-purple-400 mt-1">
          {progressPercent.toFixed(0)}% mastered
        </p>
      </div>

      <div className="text-xs md:text-sm mb-2 space-y-0.5">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <span className="text-purple-500">{stats.total} cards</span>
          {stats.strugglingCards.length > 0 && (
            <span className="text-red-500">
              🔥 {stats.strugglingCards.length} struggling
            </span>
          )}
        </div>
        {dueCount > 0 ? (
          <p className="text-pink-500 font-medium">
            ⏰ {dueCount} due for review
          </p>
        ) : (
          <p className="text-green-500">✨ All caught up!</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onView(deck)}
          className="flex-1 py-1.5 rounded-lg bg-purple-100 text-purple-600 text-xs md:text-sm hover:bg-purple-200 transition-colors flex items-center justify-center gap-1"
        >
          <BookOpen className="w-3.5 h-3.5" />
          View
        </button>
        <button
          onClick={() => onStudy(deck)}
          disabled={dueCount === 0}
          className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white text-xs md:text-sm hover:from-pink-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <Brain className="w-3.5 h-3.5" />
          Study
        </button>
      </div>
    </div>
  );
}
