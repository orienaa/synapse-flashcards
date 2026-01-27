import { useState, useMemo } from "react";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Plus,
  Search,
  X,
  FileDown,
  BarChart3,
} from "lucide-react";
import type { Deck, Flashcard } from "../../types";
import {
  getDetailedDeckStats,
  getCardDifficulty,
  getCardStatus,
} from "../../utils/spacedRepetition";
import { EditCardModal } from "../modals/EditCardModal";
import { ConfirmDialog } from "../modals/ConfirmDialog";
import { ExportImportModal } from "../modals/ExportImportModal";
import { DeckStatistics } from "./DeckStatistics";
import type { AnkiDeck } from "../../utils/anki";

interface DeckViewProps {
  deck: Deck;
  onStudy: (deck: Deck, customCards?: Flashcard[]) => void;
  onUpdateCard: (cardId: string, updates: Partial<Flashcard>) => void;
  onDeleteCard: (cardId: string) => void;
  onAddCard: (card: Omit<Flashcard, "id">) => void;
  onRenameDeck: (newName: string) => void;
  onImportAnkiDecks?: (decks: AnkiDeck[]) => void;
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
    <div className={`${color} rounded-lg p-2 md:p-3 flex items-center gap-2`}>
      {icon}
      <div>
        <p className="text-xs opacity-80">{label}</p>
        <p className="text-sm md:text-base font-medium">{value}</p>
      </div>
    </div>
  );
}

function CardItem({
  card,
  index,
  onEdit,
  onDelete,
}: {
  card: Flashcard;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const difficulty = getCardDifficulty(card);
  const status = getCardStatus(card);

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-purple-950 rounded-lg border-2 border-pink-100 dark:border-purple-800 overflow-hidden">
      <div
        className="p-2 md:p-3 cursor-pointer hover:bg-pink-50/50 dark:hover:bg-purple-900/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-2">
          <span className="text-purple-400 dark:text-purple-400 text-xs md:text-sm font-medium min-w-6">
            #{index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-purple-700 dark:text-purple-200 text-xs md:text-sm font-medium truncate">
              {card.question}
            </p>
            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-500 dark:text-purple-300 rounded text-[10px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-xs px-1.5 py-0.5 rounded ${status.color}`}>
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
        <div className="px-2 md:px-3 pb-2 md:pb-3 border-t border-pink-100 dark:border-purple-700 pt-2 space-y-2">
          <div>
            <p className="text-purple-400 dark:text-purple-400 text-xs">
              Answer:
            </p>
            <p className="text-purple-600 dark:text-purple-200 text-xs md:text-sm">
              {card.answer}
            </p>
          </div>
          {card.options && card.options.length > 0 && (
            <div>
              <p className="text-purple-400 dark:text-purple-400 text-xs mb-1">
                Multiple Choice:
              </p>
              <div className="space-y-1">
                {card.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`text-xs px-2 py-1 rounded ${
                      i === card.correctIndex
                        ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-medium"
                        : "bg-white/60 dark:bg-gray-700/60 text-purple-600 dark:text-purple-300"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                    {i === card.correctIndex && " ✓"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Statistics */}
          <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-2">
            <p className="text-purple-500 dark:text-purple-300 text-xs font-medium mb-2">
              📊 Card Statistics
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 md:gap-2 text-xs">
              <div className="bg-purple-50 dark:bg-purple-900/50 rounded p-1.5">
                <p className="text-purple-400 dark:text-purple-400">Reviews</p>
                <p className="text-purple-600 dark:text-purple-200 font-medium">
                  {card.repetitions}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/50 rounded p-1.5">
                <p className="text-purple-400 dark:text-purple-400">Interval</p>
                <p className="text-purple-600 dark:text-purple-200 font-medium">
                  {card.interval < 1
                    ? "< 1 day"
                    : `${card.interval} day${card.interval !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/50 rounded p-1.5">
                <p className="text-purple-400 dark:text-purple-400">
                  Ease Factor
                </p>
                <p className={`font-medium ${difficulty.color}`}>
                  {((card.easeFactor * 100) / 2.5).toFixed(0)}%
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/50 rounded p-1.5">
                <p className="text-purple-400 dark:text-purple-400">
                  Difficulty
                </p>
                <p className={`font-medium ${difficulty.color}`}>
                  {difficulty.label}
                </p>
              </div>
            </div>

            {/* Next Review & Last Review */}
            <div className="mt-2 pt-2 border-t border-purple-100 dark:border-purple-700 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-purple-400 dark:text-purple-400">
                  Next Review:
                </p>
                <p className="text-purple-600 dark:text-purple-200">
                  {(() => {
                    const nextReview = new Date(card.nextReview);
                    const today = new Date();
                    const diffDays = Math.ceil(
                      (nextReview.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    if (diffDays <= 0) return "📍 Due now";
                    if (diffDays === 1) return "⏰ Tomorrow";
                    return `📅 In ${diffDays} days`;
                  })()}
                </p>
              </div>
              <div>
                <p className="text-purple-400 dark:text-purple-400">
                  Last Review:
                </p>
                <p className="text-purple-600 dark:text-purple-200">
                  {card.lastReview
                    ? new Date(card.lastReview).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    : "Never"}
                </p>
              </div>
            </div>
          </div>
          {/* Edit/Delete Buttons */}
          <div className="flex gap-2 pt-1 border-t border-pink-100 dark:border-purple-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DeckView({
  deck,
  onStudy,
  onUpdateCard,
  onDeleteCard,
  onAddCard,
  onRenameDeck,
  onImportAnkiDecks,
}: DeckViewProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "struggling" | "upcoming" | "stats"
  >("all");
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [deckName, setDeckName] = useState(deck.name);
  const [showExportImport, setShowExportImport] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const stats = getDetailedDeckStats(deck.cards);

  const dueCount =
    stats.cardsByStatus.overdue.length + stats.cardsByStatus.dueToday.length;

  // Extract all unique tags from the deck
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    deck.cards.forEach((card) => {
      card.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [deck.cards]);

  // Filter cards based on search query and selected tag
  const filteredCards = useMemo(() => {
    let cards = deck.cards;

    // Filter by tag first
    if (selectedTag) {
      cards = cards.filter((card) => card.tags?.includes(selectedTag));
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(
        (card) =>
          card.question.toLowerCase().includes(query) ||
          card.answer.toLowerCase().includes(query),
      );
    }

    return cards;
  }, [deck.cards, searchQuery, selectedTag]);

  const handleSaveCard = (cardData: {
    question: string;
    answer: string;
    options?: string[];
    correctIndex?: number;
    tags?: string[];
  }) => {
    if (editingCard) {
      onUpdateCard(editingCard.id, cardData);
      setEditingCard(null);
    } else if (isAddingCard) {
      onAddCard({
        question: cardData.question,
        answer: cardData.answer,
        options: cardData.options,
        correctIndex: cardData.correctIndex,
        tags: cardData.tags,
        repetitions: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReview: new Date(),
        lastReview: null,
      });
      setIsAddingCard(false);
    }
  };

  const handleDeleteCard = () => {
    if (deletingCard) {
      onDeleteCard(deletingCard.id);
      setDeletingCard(null);
    }
  };

  const handleDeleteFromEdit = () => {
    if (editingCard) {
      setDeletingCard(editingCard);
      setEditingCard(null);
    }
  };

  const handleSaveName = () => {
    if (deckName.trim() && deckName.trim() !== deck.name) {
      onRenameDeck(deckName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="space-y-3 md:space-y-4 h-full flex flex-col">
      {/* Deck Name - Editable */}
      <div className="flex items-center gap-2">
        {isEditingName ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") {
                  setDeckName(deck.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="flex-1 px-3 py-1.5 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-purple-700 font-medium"
            />
            <button
              onClick={handleSaveName}
              className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setDeckName(deck.name);
                setIsEditingName(false);
              }}
              className="px-3 py-1.5 rounded-lg border border-purple-200 text-purple-500 text-sm hover:bg-purple-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="flex items-center gap-2 text-purple-500 hover:text-purple-700 transition-colors group"
            title="Click to rename deck"
          >
            <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs text-purple-400">Rename deck</span>
          </button>
        )}
      </div>

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
            All Cards ({searchQuery ? `${filteredCards.length}/` : ""}
            {deck.cards.length})
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
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm transition-colors ${
              activeTab === "stats"
                ? "bg-blue-500 text-white"
                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
            }`}
          >
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Dashboard
            </span>
          </button>
        </div>
        <div className="flex gap-2">
          {/* Study filtered cards button - shows when viewing subset */}
          {((activeTab === "struggling" && stats.strugglingCards.length > 0) ||
            (activeTab === "upcoming" && stats.upcomingCards.length > 0) ||
            (activeTab === "all" &&
              searchQuery &&
              filteredCards.length > 0)) && (
            <button
              onClick={() => {
                let cardsToStudy: Flashcard[] = [];
                if (activeTab === "struggling") {
                  cardsToStudy = stats.strugglingCards;
                } else if (activeTab === "upcoming") {
                  cardsToStudy = stats.upcomingCards.map((u) => u.card);
                } else if (searchQuery) {
                  cardsToStudy = filteredCards;
                }
                if (cardsToStudy.length > 0) {
                  onStudy(deck, cardsToStudy);
                }
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-pink-400 text-white text-xs md:text-sm hover:from-orange-500 hover:to-pink-500 transition-all flex items-center gap-1"
            >
              <Brain className="w-4 h-4" />
              Study These (
              {activeTab === "struggling"
                ? stats.strugglingCards.length
                : activeTab === "upcoming"
                  ? stats.upcomingCards.length
                  : filteredCards.length}
              )
            </button>
          )}
          <button
            onClick={() => onStudy(deck)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white text-xs md:text-sm hover:from-pink-500 hover:to-purple-500 transition-all flex items-center gap-1"
          >
            <Brain className="w-4 h-4" />
            Study All {dueCount > 0 ? `(${dueCount} due)` : ""}
          </button>
        </div>
      </div>

      {/* Search Bar - Hidden on stats tab */}
      {activeTab !== "stats" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards..."
            className="w-full pl-9 pr-8 py-2 rounded-lg border-2 border-purple-200 dark:border-purple-700 dark:bg-gray-800 focus:border-purple-400 focus:outline-none text-sm text-purple-700 dark:text-purple-200 placeholder-purple-300 dark:placeholder-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Tag Filter - Hidden on stats tab */}
      {activeTab !== "stats" && allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-purple-400 mr-1">🏷️ Filter:</span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
              selectedTag === null
                ? "bg-purple-500 text-white"
                : "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                selectedTag === tag
                  ? "bg-purple-500 text-white"
                  : "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Cards List or Statistics Dashboard */}
      <div className="flex-1 overflow-auto space-y-2">
        {activeTab === "stats" && <DeckStatistics deck={deck} />}

        {activeTab === "all" && filteredCards.length === 0 && searchQuery && (
          <div className="text-center py-6 text-purple-400 text-sm">
            🔍 No cards matching "{searchQuery}"
          </div>
        )}

        {activeTab === "all" &&
          filteredCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              index={deck.cards.findIndex((c) => c.id === card.id)}
              onEdit={() => setEditingCard(card)}
              onDelete={() => setDeletingCard(card)}
            />
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
                  onEdit={() => setEditingCard(card)}
                  onDelete={() => setDeletingCard(card)}
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
                    onEdit={() => setEditingCard(card)}
                    onDelete={() => setDeletingCard(card)}
                  />
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsAddingCard(true)}
          className="flex-1 py-2 rounded-lg border-2 border-dashed border-purple-300 text-purple-500 text-sm hover:bg-purple-50 hover:border-purple-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Card
        </button>
        <button
          onClick={() => setShowExportImport(true)}
          className="py-2 px-3 rounded-lg border-2 border-purple-300 text-purple-500 text-sm hover:bg-purple-50 hover:border-purple-400 transition-colors flex items-center justify-center gap-2"
          title="Export/Import Cards"
        >
          <FileDown className="w-4 h-4" />
        </button>
      </div>

      {/* Edit/Add Card Modal */}
      {(editingCard || isAddingCard) && (
        <EditCardModal
          card={editingCard}
          onSave={handleSaveCard}
          onDelete={editingCard ? handleDeleteFromEdit : undefined}
          onClose={() => {
            setEditingCard(null);
            setIsAddingCard(false);
          }}
          existingTags={allTags}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingCard && (
        <ConfirmDialog
          title="Delete Card?"
          message={`Are you sure you want to delete this card? This cannot be undone.`}
          confirmText="Delete"
          cancelText="Keep Card"
          variant="danger"
          onConfirm={handleDeleteCard}
          onCancel={() => setDeletingCard(null)}
        />
      )}

      {/* Export/Import Modal */}
      {showExportImport && (
        <ExportImportModal
          deck={deck}
          onClose={() => setShowExportImport(false)}
          onImport={(cards) => {
            cards.forEach((card) => onAddCard(card));
          }}
          onImportAnkiDecks={onImportAnkiDecks}
        />
      )}
    </div>
  );
}
