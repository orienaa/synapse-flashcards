import { useState } from "react";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Deck, Flashcard } from "../types";
import {
  getDetailedDeckStats,
  getCardDifficulty,
  getCardStatus,
} from "../utils/spacedRepetition";

interface DeckViewProps {
  deck: Deck;
  onStudy: (deck: Deck) => void;
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className={`${color} rounded-lg p-2 md:p-3 flex items-center gap-2`}
    >
      {icon}
      <div>
        <p className="text-xs opacity-80">{label}</p>
        <p className="text-sm md:text-base font-medium">{value}</p>
      </div>
    </div>
  );
}

function CardItem({ card, index }: { card: Flashcard; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const difficulty = getCardDifficulty(card);
  const status = getCardStatus(card);

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-pink-100 overflow-hidden">
      <div
        className="p-2 md:p-3 cursor-pointer hover:bg-pink-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-2">
          <span className="text-purple-400 text-xs md:text-sm font-medium min-w-6">
            #{index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-purple-700 text-xs md:text-sm font-medium truncate">
              {card.question}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${status.color}`}
            >
              {status.label}
            </span>
            <span className={`text-xs md:text-sm ${difficulty.color}`}>
              {difficulty.emoji}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-purple-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-400" />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-2 md:px-3 pb-2 md:pb-3 border-t border-pink-100 pt-2 space-y-2">
          <div>
            <p className="text-purple-400 text-xs">Answer:</p>
            <p className="text-purple-600 text-xs md:text-sm">{card.answer}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 md:gap-2 text-xs">
            <div className="bg-white/60 rounded p-1.5">
              <p className="text-purple-400">Repetitions</p>
              <p className="text-purple-600 font-medium">{card.repetitions}</p>
            </div>
            <div className="bg-white/60 rounded p-1.5">
              <p className="text-purple-400">Interval</p>
              <p className="text-purple-600 font-medium">
                {card.interval} days
              </p>
            </div>
            <div className="bg-white/60 rounded p-1.5">
              <p className="text-purple-400">Ease</p>
              <p className={`font-medium ${difficulty.color}`}>
                {card.easeFactor.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/60 rounded p-1.5">
              <p className="text-purple-400">Difficulty</p>
              <p className={`font-medium ${difficulty.color}`}>
                {difficulty.label}
              </p>
            </div>
          </div>
          {card.lastReview && (
            <p className="text-purple-400 text-xs">
              Last reviewed: {new Date(card.lastReview).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function DeckView({ deck, onStudy }: DeckViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "struggling" | "upcoming">(
    "all",
  );
  const stats = getDetailedDeckStats(deck.cards);

  const dueCount =
    stats.cardsByStatus.overdue.length + stats.cardsByStatus.dueToday.length;

  return (
    <div className="space-y-3 md:space-y-4 h-full flex flex-col">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
        <StatCard
          icon={<TrendingUp className="w-4 h-4 md:w-5 md:h-5" />}
          label="Total Reviews"
          value={stats.totalReviews}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={<Star className="w-4 h-4 md:w-5 md:h-5" />}
          label="Retention"
          value={`${stats.retentionRate.toFixed(0)}%`}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={<Brain className="w-4 h-4 md:w-5 md:h-5" />}
          label="Avg. Ease"
          value={stats.avgEaseFactor.toFixed(2)}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />}
          label="Struggling"
          value={stats.strugglingCards.length}
          color="bg-red-100 text-red-600"
        />
        <StatCard
          icon={<Clock className="w-4 h-4 md:w-5 md:h-5" />}
          label="Due Soon"
          value={stats.upcomingCards.length}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-white/60 rounded-lg p-2 md:p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-purple-600 text-xs md:text-sm font-medium">
            Learning Progress
          </span>
          <span className="text-purple-400 text-xs">
            {stats.mastered} / {stats.total} mastered
          </span>
        </div>
        <div className="h-2 bg-purple-100 rounded-full overflow-hidden flex">
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
        <div className="flex flex-wrap gap-3 mt-1 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-green-600">Mastered ({stats.mastered})</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-blue-600">Learning ({stats.learning})</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-400 rounded-full" />
            <span className="text-orange-600">New ({stats.new})</span>
          </span>
        </div>
      </div>

      {/* Due Schedule */}
      {(stats.cardsByStatus.overdue.length > 0 ||
        stats.cardsByStatus.dueToday.length > 0 ||
        stats.cardsByStatus.dueTomorrow.length > 0) && (
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-2 md:p-3">
          <p className="text-purple-600 text-xs md:text-sm font-medium mb-1">
            📅 Review Schedule
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {stats.cardsByStatus.overdue.length > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-600 rounded">
                🚨 {stats.cardsByStatus.overdue.length} overdue
              </span>
            )}
            {stats.cardsByStatus.dueToday.length > 0 && (
              <span className="px-2 py-1 bg-pink-200 text-pink-600 rounded">
                📍 {stats.cardsByStatus.dueToday.length} due today
              </span>
            )}
            {stats.cardsByStatus.dueTomorrow.length > 0 && (
              <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded">
                ⏰ {stats.cardsByStatus.dueTomorrow.length} due tomorrow
              </span>
            )}
            {stats.cardsByStatus.dueThisWeek.length > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                📆 {stats.cardsByStatus.dueThisWeek.length} this week
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 md:gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm transition-colors ${
              activeTab === "all"
                ? "bg-purple-500 text-white"
                : "bg-purple-100 text-purple-600 hover:bg-purple-200"
            }`}
          >
            All Cards ({deck.cards.length})
          </button>
          <button
            onClick={() => setActiveTab("struggling")}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm transition-colors ${
              activeTab === "struggling"
                ? "bg-red-500 text-white"
                : "bg-red-100 text-red-600 hover:bg-red-200"
            }`}
          >
            🔥 Struggling ({stats.strugglingCards.length})
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm transition-colors ${
              activeTab === "upcoming"
                ? "bg-orange-500 text-white"
                : "bg-orange-100 text-orange-600 hover:bg-orange-200"
            }`}
          >
            ⏰ Upcoming ({stats.upcomingCards.length})
          </button>
        </div>
        <button
          onClick={() => onStudy(deck)}
          disabled={dueCount === 0}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white text-xs md:text-sm hover:from-pink-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Brain className="w-4 h-4" />
          Study ({dueCount} due)
        </button>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-auto space-y-2">
        {activeTab === "all" &&
          deck.cards.map((card, index) => (
            <CardItem key={card.id} card={card} index={index} />
          ))}

        {activeTab === "struggling" && (
          <>
            {stats.strugglingCards.length === 0 ? (
              <div className="text-center py-6 text-purple-400 text-sm">
                🎉 No struggling cards! You're doing great!
              </div>
            ) : (
              stats.strugglingCards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  index={deck.cards.findIndex((c) => c.id === card.id)}
                />
              ))
            )}
          </>
        )}

        {activeTab === "upcoming" && (
          <>
            {stats.upcomingCards.length === 0 ? (
              <div className="text-center py-6 text-purple-400 text-sm">
                📭 No upcoming reviews this week!
              </div>
            ) : (
              stats.upcomingCards.map(({ card, daysUntilDue }) => (
                <div key={card.id} className="relative">
                  <div className="absolute left-1 top-1 z-10 px-1.5 py-0.5 bg-orange-400 text-white text-xs rounded">
                    in {daysUntilDue}d
                  </div>
                  <CardItem
                    card={card}
                    index={deck.cards.findIndex((c) => c.id === card.id)}
                  />
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
