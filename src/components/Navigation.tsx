import { ChevronLeft, Plus } from "lucide-react";
import type { View, Deck } from "../types";

interface NavigationProps {
  view: View;
  selectedDeck: Deck | null;
  currentCardIndex: number;
  studyCardsLength: number;
  onBack: () => void;
  onCreateDeck: () => void;
}

export function Navigation({
  view,
  selectedDeck,
  currentCardIndex,
  studyCardsLength,
  onBack,
  onCreateDeck,
}: NavigationProps) {
  return (
    <div className="flex items-center justify-between mb-3 md:mb-4 flex-shrink-0">
      {view !== "home" ? (
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 hover:from-pink-300 hover:to-purple-300 transition-all transform hover:scale-110"
        >
          <ChevronLeft className="text-purple-600 w-5 h-5" />
        </button>
      ) : (
        <div />
      )}

      <div className="text-center flex items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-lg md:text-xl lg:text-2xl text-purple-600 font-medium">
            {view === "home" && "My Decks"}
            {view === "study" && selectedDeck?.name}
            {view === "deck-view" && selectedDeck?.name}
          </h2>
          {view === "study" && (
            <p className="text-purple-400 text-sm">
              Card {currentCardIndex + 1} of {studyCardsLength}
            </p>
          )}
        </div>
        {view === "home" && (
          <button
            onClick={onCreateDeck}
            className="p-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-110 shadow-lg"
          >
            <Plus className="text-white w-5 h-5" />
          </button>
        )}
      </div>

      <div className="w-9" />
    </div>
  );
}
