import { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import "./App.css";

import type {
  Deck,
  View,
  Flashcard,
  StudyResponse,
  ParsedCard,
  SessionStats,
} from "./types";
import {
  calculateNextReview,
  getDueCards,
  createFlashcard,
} from "./utils/spacedRepetition";
import { ExampleDeck } from "./utils/data";
import {
  onAuthChange,
  signOut,
  saveDeckToCloud,
  deleteCloudDeck,
  subscribeToDecks,
} from "./utils/firebase";
import {
  Header,
  Footer,
  DecorativeElements,
  EmptyState,
  DeckCard,
  DeckView,
  FlashcardStudy,
  CreateDeckModal,
  Navigation,
  AuthModal,
} from "./components";

const STORAGE_KEYS = {
  DECKS: "flashcard-decks",
} as const;

// Get API key from environment variable
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

// Create the preloaded deck from ExampleDeck
function createPreloadedDeck(): Deck {
  return {
    id: "example-deck",
    name: ExampleDeck.title,
    cards: ExampleDeck.cards.map((card) =>
      createFlashcard(card.question, card.answer),
    ),
    createdAt: new Date(),
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [view, setView] = useState<View>("home");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Study state
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    correct: 0,
    forgot: 0,
    easy: 0,
  });

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Load decks - from cloud if logged in, otherwise localStorage
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      // Subscribe to real-time cloud sync
      const unsubscribe = subscribeToDecks(user.uid, (cloudDecks) => {
        // Add example deck if no decks exist
        if (cloudDecks.length === 0) {
          const preloadedDeck = createPreloadedDeck();
          saveDeckToCloud(user.uid, preloadedDeck);
        } else {
          setDecks(cloudDecks);
        }
      });
      return unsubscribe;
    } else {
      // Load from localStorage for non-logged-in users
      const savedDecks = localStorage.getItem(STORAGE_KEYS.DECKS);
      let loadedDecks: Deck[] = [];

      if (savedDecks) {
        try {
          loadedDecks = JSON.parse(savedDecks).map((deck: any) => ({
            ...deck,
            createdAt: new Date(deck.createdAt),
            cards: deck.cards.map((card: any) => ({
              ...card,
              nextReview: new Date(card.nextReview),
              lastReview: card.lastReview ? new Date(card.lastReview) : null,
            })),
          }));
        } catch (e) {
          console.error("Failed to parse saved decks:", e);
        }
      }

      const hasExampleDeck = loadedDecks.some((d) => d.id === "example-deck");
      if (loadedDecks.length === 0 || !hasExampleDeck) {
        const preloadedDeck = createPreloadedDeck();
        loadedDecks = [
          preloadedDeck,
          ...loadedDecks.filter((d) => d.id !== "example-deck"),
        ];
      }

      setDecks(loadedDecks);
    }
  }, [user, authLoading]);

  // Save decks to localStorage (only when not logged in)
  useEffect(() => {
    if (!user && !authLoading && decks.length > 0) {
      localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
    }
  }, [decks, user, authLoading]);

  const handleCreateDeck = async (name: string, cards: ParsedCard[]) => {
    const newDeck: Deck = {
      id: Date.now().toString(),
      name,
      cards: cards.map((card) => createFlashcard(card.question, card.answer)),
      createdAt: new Date(),
    };

    if (user) {
      await saveDeckToCloud(user.uid, newDeck);
    } else {
      setDecks([...decks, newDeck]);
    }
    setShowCreateModal(false);
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (user) {
      await deleteCloudDeck(user.uid, deckId);
    } else {
      setDecks(decks.filter((d) => d.id !== deckId));
    }

    if (selectedDeck?.id === deckId) {
      setSelectedDeck(null);
      setView("home");
    }
  };

  const handleStartStudy = (deck: Deck) => {
    const dueCards = getDueCards(deck.cards, 20);
    if (dueCards.length === 0) {
      alert("No cards due for review! Come back later.");
      return;
    }
    setSelectedDeck(deck);
    setStudyCards(dueCards);
    setCurrentCardIndex(0);
    setSessionStats({ correct: 0, forgot: 0, easy: 0 });
    setView("study");
  };

  const handleResponse = async (response: StudyResponse) => {
    const currentCard = studyCards[currentCardIndex];
    const updatedCard = calculateNextReview(currentCard, response);

    // Update the card in the deck
    const updatedDecks = decks.map((deck) => {
      if (deck.id !== selectedDeck?.id) return deck;
      return {
        ...deck,
        cards: deck.cards.map((card) =>
          card.id === updatedCard.id ? updatedCard : card,
        ),
      };
    });

    if (user) {
      const updatedDeck = updatedDecks.find((d) => d.id === selectedDeck?.id);
      if (updatedDeck) {
        await saveDeckToCloud(user.uid, updatedDeck);
      }
    } else {
      setDecks(updatedDecks);
    }

    // Update session stats
    setSessionStats((prev) => ({
      ...prev,
      [response]: prev[response] + 1,
    }));

    // If forgot, add card back to the end of study session
    if (response === "forgot") {
      setStudyCards((prev) => [...prev, updatedCard]);
    }

    // Move to next card
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      // Session complete
      setView("home");
    }
  };

  const handleViewDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    setView("deck-view");
  };

  const handleSignOut = async () => {
    await signOut();
    setDecks([]);
    // Reload local decks after sign out
    const savedDecks = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (savedDecks) {
      try {
        const loadedDecks = JSON.parse(savedDecks).map((deck: any) => ({
          ...deck,
          createdAt: new Date(deck.createdAt),
          cards: deck.cards.map((card: any) => ({
            ...card,
            nextReview: new Date(card.nextReview),
            lastReview: card.lastReview ? new Date(card.lastReview) : null,
          })),
        }));
        setDecks(loadedDecks);
      } catch (e) {
        const preloadedDeck = createPreloadedDeck();
        setDecks([preloadedDeck]);
      }
    } else {
      const preloadedDeck = createPreloadedDeck();
      setDecks([preloadedDeck]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-500 text-lg animate-pulse">
          Loading... ✨
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-3 md:p-4 flex flex-col">
      <Header
        user={user}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Card */}
      <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-3 md:p-4 border-4 border-pink-200 flex flex-col min-h-0">
        <Navigation
          view={view}
          selectedDeck={selectedDeck}
          currentCardIndex={currentCardIndex}
          studyCardsLength={studyCards.length}
          onBack={() => setView("home")}
          onCreateDeck={() => setShowCreateModal(true)}
        />

        <DecorativeElements />

        {/* Content based on view */}
        <div className="flex-1 min-h-0 overflow-auto">
          {view === "home" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {decks.length === 0 ? (
                <EmptyState />
              ) : (
                decks.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    onDelete={handleDeleteDeck}
                    onView={handleViewDeck}
                    onStudy={handleStartStudy}
                  />
                ))
              )}
            </div>
          )}

          {view === "deck-view" && selectedDeck && (
            <DeckView deck={selectedDeck} onStudy={handleStartStudy} />
          )}

          {view === "study" && studyCards.length > 0 && (
            <FlashcardStudy
              cards={studyCards}
              currentIndex={currentCardIndex}
              sessionStats={sessionStats}
              onResponse={handleResponse}
            />
          )}
        </div>
      </div>

      <Footer />

      {/* Modals */}
      {showCreateModal && (
        <CreateDeckModal
          apiKey={API_KEY}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateDeck}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
