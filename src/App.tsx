import { useState, useEffect, useMemo } from "react";
import type { User } from "firebase/auth";
import "./App.css";

import type {
  Deck,
  View,
  Flashcard,
  StudyResponse,
  ParsedCard,
  SessionStats,
  Folder,
} from "./types";
import {
  calculateNextReview,
  getDueCards,
  createFlashcard,
} from "./utils/spacedRepetition";
import { ExampleDeck, ExampleDeck2 } from "./utils/data";
import {
  onAuthChange,
  signOut,
  saveDeckToCloud,
  deleteCloudDeck,
  subscribeToDecks,
  saveFolderToCloud,
  deleteCloudFolder,
  subscribeToFolders,
} from "./utils/firebase";
import {
  loadDecksFromStorage,
  loadFoldersFromStorage,
  saveDecksToStorage,
  saveFoldersToStorage,
  getDeletedExampleDeckIds,
  addDeletedExampleDeckId,
} from "./utils/storage";
import {
  addDeletedExampleDeckIdCloud,
  subscribeToUserSettings,
} from "./utils/firebase";
import {
  Header,
  Footer,
  DeckView,
  FlashcardStudy,
  CreateDeckModal,
  Navigation,
  AuthModal,
  SessionComplete,
  HomeView,
  AnkiImportModal,
} from "./components";
import { useStreak, useTheme, useStudyTimer, useSettings } from "./hooks";
import { AnkiDeck } from "./utils/anki";

// Get API key from environment variable (VITE_ prefix required for Vite to expose it)
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

// Generate unique IDs
const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create the preloaded decks from ExampleDeck and ExampleDeck2
function createPreloadedDecks(): Deck[] {
  return [
    {
      id: "example-deck",
      name: ExampleDeck.title,
      cards: ExampleDeck.cards.map((card) =>
        createFlashcard(
          card.question,
          card.answer,
          "options" in card ? (card as any).options : undefined,
          "correctIndex" in card ? (card as any).correctIndex : undefined,
        ),
      ),
      createdAt: new Date(),
    },
    {
      id: "example-deck-2",
      name: ExampleDeck2.title,
      cards: ExampleDeck2.cards.map((card) =>
        createFlashcard(
          card.question,
          card.answer,
          "options" in card ? (card as any).options : undefined,
          "correctIndex" in card ? (card as any).correctIndex : undefined,
        ),
      ),
      createdAt: new Date(),
    },
  ];
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [view, setView] = useState<View>("home");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnkiImportModal, setShowAnkiImportModal] = useState(false);

  // Study state
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    correct: 0,
    forgot: 0,
    easy: 0,
  });

  // Quiz settings
  const { quizCardCount, shuffleMode, setQuizCardCount, setShuffleMode } =
    useSettings();

  // Streak tracking (with Firebase sync when logged in)
  const { currentStreak, longestStreak, studiedToday, recordStudySession } =
    useStreak(user?.uid);

  // Theme management
  const { isDark, toggleTheme } = useTheme();

  // Study session timer
  const {
    formattedTime: studyTimer,
    restart: restartTimer,
    reset: resetTimer,
    pause: pauseTimer,
  } = useStudyTimer();

  // Calculate total due cards across all decks
  const totalDueCards = useMemo(() => {
    const now = new Date();
    return decks.reduce((total, deck) => {
      const dueInDeck = deck.cards.filter(
        (card) => new Date(card.nextReview) <= now,
      ).length;
      return total + dueInDeck;
    }, 0);
  }, [decks]);

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

    let unsubDecks: (() => void) | null = null;
    let unsubFolders: (() => void) | null = null;
    let unsubSettings: (() => void) | null = null;

    if (user) {
      // Subscribe to user settings for deleted example deck ids
      unsubSettings = subscribeToUserSettings(user.uid, (settings) => {
        const deletedExampleIds = new Set(
          settings?.deletedExampleDeckIds || [],
        );
        if (unsubDecks) unsubDecks();
        unsubDecks = subscribeToDecks(user.uid, (cloudDecks) => {
          const preloadedDecks = createPreloadedDecks();
          // Only add example decks that are not deleted
          const missing = preloadedDecks.filter(
            (deck) =>
              !cloudDecks.some((d) => d.id === deck.id) &&
              !deletedExampleIds.has(deck.id),
          );
          if (cloudDecks.length === 0 || missing.length > 0) {
            missing.forEach((deck) => saveDeckToCloud(user.uid, deck));
            setDecks([...cloudDecks, ...missing]);
          } else {
            setDecks(cloudDecks);
          }
        });
      });
      unsubFolders = subscribeToFolders(user.uid, (cloudFolders) => {
        setFolders(cloudFolders);
      });
      return () => {
        if (unsubDecks) unsubDecks();
        if (unsubFolders) unsubFolders();
        if (unsubSettings) unsubSettings();
      };
    } else {
      // Load from localStorage for non-logged-in users
      let loadedDecks = loadDecksFromStorage();
      const deletedExampleIds = getDeletedExampleDeckIds();
      const preloadedDecks = createPreloadedDecks();
      // Add any missing example decks that are not deleted
      preloadedDecks.forEach((deck) => {
        if (
          !loadedDecks.some((d) => d.id === deck.id) &&
          !deletedExampleIds.has(deck.id)
        ) {
          loadedDecks = [deck, ...loadedDecks];
        }
      });
      setDecks(loadedDecks);
      setFolders(loadFoldersFromStorage());
    }
  }, [user, authLoading, JSON.stringify(getDeletedExampleDeckIds())]);

  // Save decks to localStorage (only when not logged in)
  useEffect(() => {
    if (!user && !authLoading && decks.length > 0) {
      saveDecksToStorage(decks);
    }
  }, [decks, user, authLoading]);

  // Save folders to localStorage (only when not logged in)
  useEffect(() => {
    if (!user && !authLoading) {
      saveFoldersToStorage(folders);
    }
  }, [folders, user, authLoading]);

  const handleCreateDeck = async (name: string, cards: ParsedCard[]) => {
    const newDeck: Deck = {
      id: Date.now().toString(),
      name,
      cards: cards.map((card) =>
        createFlashcard(
          card.question,
          card.answer,
          card.options,
          card.correctIndex,
        ),
      ),
      createdAt: new Date(),
    };

    if (user) {
      await saveDeckToCloud(user.uid, newDeck);
    } else {
      setDecks([...decks, newDeck]);
    }
    setShowCreateModal(false);
  };

  // Import multiple Anki decks
  const handleImportAnkiDecks = async (ankiDecks: AnkiDeck[]) => {
    const newDecks: Deck[] = ankiDecks.map((ankiDeck, index) => ({
      id: `${Date.now()}-${index}`,
      name: ankiDeck.name,
      cards: ankiDeck.cards.map((card: ParsedCard) =>
        createFlashcard(
          card.question,
          card.answer,
          card.options,
          card.correctIndex,
        ),
      ),
      createdAt: new Date(),
    }));

    if (user) {
      for (const deck of newDecks) {
        await saveDeckToCloud(user.uid, deck);
      }
    } else {
      setDecks([...decks, ...newDecks]);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    // If deleting an example deck, record it as deleted
    if (deckId === "example-deck" || deckId === "example-deck-2") {
      if (user) {
        await addDeletedExampleDeckIdCloud(user.uid, deckId);
      } else {
        addDeletedExampleDeckId(deckId);
      }
    }
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

  const handleStartStudy = (deck: Deck, customCards?: Flashcard[]) => {
    const cardsSource = customCards || deck.cards;
    if (cardsSource.length === 0) {
      alert("This deck has no cards yet!");
      return;
    }
    let cardsToStudy = customCards
      ? customCards.slice(0, quizCardCount) // For custom selection, just take the cards
      : getDueCards(deck.cards, quizCardCount); // For full deck, get due cards

    // Shuffle if enabled
    if (shuffleMode) {
      cardsToStudy = [...cardsToStudy].sort(() => Math.random() - 0.5);
    }

    setSelectedDeck(deck);
    setStudyCards(cardsToStudy);
    setCurrentCardIndex(0);
    setSessionStats({ correct: 0, forgot: 0, easy: 0 });
    restartTimer(); // Start/restart timer
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
      // Session complete - record for streak and show completion screen
      recordStudySession();
      pauseTimer(); // Stop the timer when session is complete
      setView("session-complete");
    }
  };

  const handleViewDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    setView("deck-view");
  };

  // Helper to save deck and update selection
  const saveDeckAndUpdateSelection = async (updatedDeck: Deck) => {
    if (user) {
      await saveDeckToCloud(user.uid, updatedDeck);
    } else {
      setDecks(decks.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
    }
    setSelectedDeck(updatedDeck);
  };

  const handleUpdateCard = async (
    cardId: string,
    updates: Partial<Flashcard>,
  ) => {
    if (!selectedDeck) return;

    const updatedDeck = {
      ...selectedDeck,
      cards: selectedDeck.cards.map((card) =>
        card.id === cardId ? { ...card, ...updates } : card,
      ),
    };
    await saveDeckAndUpdateSelection(updatedDeck);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!selectedDeck) return;

    const updatedDeck = {
      ...selectedDeck,
      cards: selectedDeck.cards.filter((card) => card.id !== cardId),
    };
    await saveDeckAndUpdateSelection(updatedDeck);
  };

  const handleAddCard = async (cardData: Omit<Flashcard, "id">) => {
    if (!selectedDeck) return;

    const newCard: Flashcard = {
      ...cardData,
      id: generateId("card"),
    };

    const updatedDeck = {
      ...selectedDeck,
      cards: [...selectedDeck.cards, newCard],
    };
    await saveDeckAndUpdateSelection(updatedDeck);
  };

  const handleRenameDeck = async (newName: string) => {
    if (!selectedDeck) return;

    const updatedDeck = {
      ...selectedDeck,
      name: newName,
    };
    await saveDeckAndUpdateSelection(updatedDeck);
  };

  // Folder handlers
  const handleCreateFolder = async (name: string, color: string) => {
    const newFolder: Folder = {
      id: generateId("folder"),
      name,
      color,
      order: folders.length,
      createdAt: new Date(),
    };

    if (user) {
      await saveFolderToCloud(user.uid, newFolder);
    } else {
      setFolders([...folders, newFolder]);
    }
  };

  const handleUpdateFolder = async (
    folderId: string,
    name: string,
    color: string,
  ) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;

    const updatedFolder = { ...folder, name, color };

    if (user) {
      await saveFolderToCloud(user.uid, updatedFolder);
    } else {
      setFolders(folders.map((f) => (f.id === folderId ? updatedFolder : f)));
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    // Move all decks in this folder to root
    const decksInFolder = decks.filter((d) => d.folderId === folderId);
    for (const deck of decksInFolder) {
      const updatedDeck = { ...deck, folderId: null };
      if (user) {
        await saveDeckToCloud(user.uid, updatedDeck);
      } else {
        setDecks((prev) =>
          prev.map((d) => (d.id === deck.id ? updatedDeck : d)),
        );
      }
    }

    if (user) {
      await deleteCloudFolder(user.uid, folderId);
    } else {
      setFolders(folders.filter((f) => f.id !== folderId));
    }
  };

  const handleMoveDeckToFolder = async (
    deckId: string,
    folderId: string | null,
  ) => {
    const deck = decks.find((d) => d.id === deckId);
    if (!deck) return;

    const updatedDeck = { ...deck, folderId };

    if (user) {
      await saveDeckToCloud(user.uid, updatedDeck);
    } else {
      setDecks(decks.map((d) => (d.id === deckId ? updatedDeck : d)));
    }
  };

  const handleReorderDecks = async (
    reorderedIds: string[],
    _folderId: string | null,
  ) => {
    // Update order for each deck in the reordered list
    const updatedDecks = decks.map((deck) => {
      const newOrder = reorderedIds.indexOf(deck.id);
      if (newOrder !== -1) {
        return { ...deck, order: newOrder };
      }
      return deck;
    });

    if (user) {
      // Save all reordered decks
      for (const id of reorderedIds) {
        const deck = updatedDecks.find((d) => d.id === id);
        if (deck) {
          await saveDeckToCloud(user.uid, deck);
        }
      }
    } else {
      setDecks(updatedDecks);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setDecks([]);
    setFolders([]);

    // Reload local decks after sign out
    const loadedDecks = loadDecksFromStorage();
    if (loadedDecks.length > 0) {
      setDecks(loadedDecks);
    } else {
      setDecks(createPreloadedDecks());
    }

    setFolders(loadFoldersFromStorage());
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-500 text-lg animate-pulse">
          Loading... ✨
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 p-3 md:p-4 flex flex-col transition-colors">
      <Header
        user={user}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        quizCardCount={quizCardCount}
        onQuizCardCountChange={setQuizCardCount}
        shuffleMode={shuffleMode}
        onShuffleModeChange={setShuffleMode}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        studiedToday={studiedToday}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        totalDueCards={totalDueCards}
      />

      {/* Main Content Card */}
      <div className="flex-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl p-3 md:p-4 border-4 border-pink-200 dark:border-purple-800 flex flex-col min-h-0 transition-colors">
        <Navigation
          view={view}
          selectedDeck={selectedDeck}
          currentCardIndex={currentCardIndex}
          studyCardsLength={studyCards.length}
          onBack={() => {
            if (view === "study") resetTimer();
            setView("home");
          }}
          onCreateDeck={() => setShowCreateModal(true)}
          onImportAnki={() => setShowAnkiImportModal(true)}
          studyTimer={view === "study" ? studyTimer : undefined}
        />

        {/* Content based on view */}
        <div className="flex-1 min-h-0 overflow-auto">
          {view === "home" && (
            <HomeView
              decks={decks}
              folders={folders}
              onDeleteDeck={handleDeleteDeck}
              onViewDeck={handleViewDeck}
              onStudyDeck={handleStartStudy}
              onMoveDeckToFolder={handleMoveDeckToFolder}
              onCreateFolder={handleCreateFolder}
              onUpdateFolder={handleUpdateFolder}
              onDeleteFolder={handleDeleteFolder}
              onReorderDecks={handleReorderDecks}
            />
          )}

          {view === "deck-view" && selectedDeck && (
            <DeckView
              deck={selectedDeck}
              onStudy={handleStartStudy}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
              onAddCard={handleAddCard}
              onRenameDeck={handleRenameDeck}
              onImportAnkiDecks={handleImportAnkiDecks}
            />
          )}

          {view === "study" && studyCards.length > 0 && (
            <FlashcardStudy
              cards={studyCards}
              currentIndex={currentCardIndex}
              sessionStats={sessionStats}
              onResponse={handleResponse}
            />
          )}

          {view === "session-complete" && selectedDeck && (
            <SessionComplete
              stats={sessionStats}
              deckName={selectedDeck.name}
              currentStreak={currentStreak}
              studyTime={studyTimer}
              onGoHome={() => {
                resetTimer();
                setView("home");
              }}
              onStudyAgain={() => handleStartStudy(selectedDeck)}
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

      {showAnkiImportModal && (
        <AnkiImportModal
          onClose={() => setShowAnkiImportModal(false)}
          onImport={handleImportAnkiDecks}
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
