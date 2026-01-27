import { ChevronLeft, Plus, Clock, Layers } from "lucide-react";
import type { View, Deck } from "../../types";

interface NavigationProps {
  view: View;
  selectedDeck: Deck | null;
  currentCardIndex: number;
  studyCardsLength: number;
  onBack: () => void;
  onCreateDeck: () => void;
  onImportAnki?: () => void;
  studyTimer?: string;
}

export function Navigation({
  view,
  selectedDeck,
  currentCardIndex,
  studyCardsLength,
  onBack,
  onCreateDeck,
  onImportAnki,
  studyTimer,
}: NavigationProps) {
  return (
    <div className="flex items-center justify-between mb-3 md:mb-4 flex-shrink-0">
      {view !== "home" ? (
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800 hover:from-pink-300 hover:to-purple-300 dark:hover:from-pink-700 dark:hover:to-purple-700 transition-all transform hover:scale-110"
        >
          <ChevronLeft className="text-purple-600 dark:text-purple-300 w-5 h-5" />
        </button>
      ) : (
        <div />
      )}

      <div className="text-center flex items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-lg md:text-xl lg:text-2xl text-purple-600 dark:text-purple-300 font-medium">
            {view === "home" && "My Decks"}
            {view === "study" && selectedDeck?.name}
            {view === "deck-view" && selectedDeck?.name}
            {view === "session-complete" && "Session Complete"}
          </h2>
          {view === "study" && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="text-purple-400 dark:text-purple-400">
                Card {currentCardIndex + 1} of {studyCardsLength}
              </span>
              {studyTimer && (
                <span className="flex items-center gap-1 text-pink-500 dark:text-pink-400">
                  <Clock className="w-3 h-3" />
                  {studyTimer}
                </span>
              )}
            </div>
          )}
        </div>
        {view === "home" && (
          <div className="flex items-center gap-2">
            {onImportAnki && (
              <button
                onClick={onImportAnki}
                className="p-2 rounded-full bg-gradient-to-r from-purple-300 to-pink-300 dark:from-purple-600 dark:to-pink-600 hover:from-purple-400 hover:to-pink-400 dark:hover:from-purple-500 dark:hover:to-pink-500 transition-all transform hover:scale-110 shadow-lg"
                title="Import from Anki"
              >
                <Layers className="text-white w-5 h-5" />
              </button>
            )}
            <button
              onClick={onCreateDeck}
              className="p-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-110 shadow-lg"
              title="Create new deck"
            >
              <Plus className="text-white w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="w-9" />
    </div>
  );
}
