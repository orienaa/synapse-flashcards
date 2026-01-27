import { useState } from "react";
import { Trash2, BookOpen, Brain } from "lucide-react";
import type { Deck } from "../../types";
import { getDetailedDeckStats } from "../../utils/spacedRepetition";
import { ConfirmDialog } from "../modals/ConfirmDialog";

interface DeckCardProps {
  deck: Deck;
  onDelete: (id: string) => void;
  onView: (deck: Deck) => void;
  onStudy: (deck: Deck) => void;
  compact?: boolean;
}

export function DeckCard({
  deck,
  onDelete,
  onView,
  onStudy,
  compact = false,
}: DeckCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const stats = getDetailedDeckStats(deck.cards);
  const dueCount =
    stats.cardsByStatus.overdue.length + stats.cardsByStatus.dueToday.length;
  const progressPercent =
    stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-purple-950 rounded-lg p-2 border border-pink-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-500 transition-all">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm text-purple-600 dark:text-purple-300 font-medium truncate">
              {deck.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <span>{stats.total} cards</span>
              {dueCount > 0 && (
                <span className="text-pink-500 dark:text-pink-400">
                  ⏰ {dueCount} due
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onView(deck)}
              className="p-1.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onStudy(deck)}
              className="p-1.5 rounded bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:from-pink-500 hover:to-purple-500 transition-all"
            >
              <Brain className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-pink-400 dark:text-pink-300 hover:text-pink-600 dark:hover:text-pink-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <ConfirmDialog
            title="Delete Deck?"
            message={`Delete "${deck.name}" with ${stats.total} cards?`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            onConfirm={() => {
              onDelete(deck.id);
              setShowDeleteConfirm(false);
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-purple-950 rounded-xl p-2.5 border-2 border-pink-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-500 transition-all">
      <div className="flex items-start justify-between mb-1.5">
        <h3 className="text-sm text-purple-600 dark:text-purple-300 font-medium truncate flex-1">
          {deck.name}
        </h3>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-0.5 text-pink-400 dark:text-pink-300 hover:text-pink-600 dark:hover:text-pink-200 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-1.5">
        <div className="h-1 bg-purple-100 dark:bg-purple-900 rounded-full overflow-hidden flex">
          <div
            className="bg-green-400 dark:bg-green-500 transition-all"
            style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
          />
          <div
            className="bg-blue-400 dark:bg-blue-500 transition-all"
            style={{ width: `${(stats.learning / stats.total) * 100}%` }}
          />
          <div
            className="bg-orange-400 dark:bg-orange-500 transition-all"
            style={{ width: `${(stats.new / stats.total) * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-purple-400 dark:text-purple-400 mt-0.5">
          {progressPercent.toFixed(0)}% mastered
        </p>
      </div>

      <div className="text-xs mb-1.5 space-y-0.5">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <span className="text-purple-500 dark:text-purple-400">
            {stats.total} cards
          </span>
          {stats.strugglingCards.length > 0 && (
            <span className="text-red-500 dark:text-red-400">
              🔥 {stats.strugglingCards.length}
            </span>
          )}
        </div>
        {dueCount > 0 ? (
          <p className="text-pink-500 dark:text-pink-400 font-medium text-[11px]">
            ⏰ {dueCount} due
          </p>
        ) : (
          <p className="text-green-500 dark:text-green-400 text-[11px]">
            ✨ All caught up!
          </p>
        )}
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => onView(deck)}
          className="flex-1 py-1 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 text-xs hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors flex items-center justify-center gap-1"
        >
          <BookOpen className="w-3 h-3" />
          View
        </button>
        <button
          onClick={() => onStudy(deck)}
          className="flex-1 py-1 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white text-xs hover:from-pink-500 hover:to-purple-500 transition-all flex items-center justify-center gap-1"
        >
          <Brain className="w-3 h-3" />
          Study
        </button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Deck?"
          message={`Are you sure you want to delete "${deck.name}"? This will remove all ${stats.total} cards permanently.`}
          confirmText="Delete Deck"
          cancelText="Keep Deck"
          variant="danger"
          onConfirm={() => {
            onDelete(deck.id);
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
