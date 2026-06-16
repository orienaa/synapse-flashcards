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
  completeGoogleRedirectSignIn,
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
import { parseFlashcardsWithAI } from "./utils/ai";

type DifficultyMode = "easy" | "default" | "hard";
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
  const authDebugEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("authDebug");
  }, []);

  const [authDebugEvents, setAuthDebugEvents] = useState<string[]>([]);

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
  // Difficulty mode state
  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>(() => {
    return (
      (localStorage.getItem("flashcards-difficulty-mode") as DifficultyMode) ||
      "default"
    );
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
    let isMounted = true;

    const pushAuthDebug = (message: string) => {
      if (!authDebugEnabled || !isMounted) return;
      const stamp = new Date().toISOString().slice(11, 19);
      setAuthDebugEvents((prev) =>
        [`${stamp} ${message}`, ...prev].slice(0, 12),
      );
    };

    pushAuthDebug("auth init");

    const unsubscribe = onAuthChange((authUser) => {
      if (!isMounted) return;
      pushAuthDebug(`observer user=${authUser ? authUser.uid : "null"}`);
      setUser(authUser);
      setAuthLoading(false);
    });

    completeGoogleRedirectSignIn()
      .then((result) => {
        pushAuthDebug(
          `redirect user=${result?.user ? result.user.uid : "null"}`,
        );
        if (!isMounted || !result?.user) return;
        setUser(result.user);
        setAuthLoading(false);
      })
      .catch((error) => {
        pushAuthDebug(`redirect error=${error?.code || "unknown"}`);
        console.error("Google redirect sign-in failed:", error);
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authDebugEnabled) return;
    const stamp = new Date().toISOString().slice(11, 19);
    setAuthDebugEvents((prev) =>
      [
        `${stamp} render user=${user ? user.uid : "null"} loading=${authLoading}`,
        ...prev,
      ].slice(0, 12),
    );
  }, [user, authLoading, authDebugEnabled]);

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
          let updatedDecks = [...cloudDecks];
          preloadedDecks.forEach((deck) => {
            if (deletedExampleIds.has(deck.id)) return;
            const idx = updatedDecks.findIndex((d) => d.id === deck.id);
            if (idx === -1) {
              saveDeckToCloud(user.uid, deck);
              updatedDecks.push(deck);
            } else if (
              typeof updatedDecks[idx].version === "number" &&
              typeof deck.version === "number" &&
              updatedDecks[idx].version < deck.version
            ) {
              saveDeckToCloud(user.uid, deck);
              updatedDecks[idx] = deck;
            }
          });

          // Only add example decks that are not deleted
          setDecks(updatedDecks);
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
      preloadedDecks.forEach((exampleDeck) => {
        if (deletedExampleIds.has(exampleDeck.id)) return;
        const idx = loadedDecks.findIndex((d) => d.id === exampleDeck.id);
        if (idx === -1) {
          loadedDecks = [exampleDeck, ...loadedDecks];
        } else if (
          typeof loadedDecks[idx].version === "number" &&
          typeof exampleDeck.version === "number" &&
          loadedDecks[idx].version < exampleDeck.version
        ) {
          loadedDecks[idx] = exampleDeck;
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

  const handleStartStudy = async (
    deck: Deck,
    customCards?: Flashcard[],
    mode?: DifficultyMode,
  ) => {
    const cardsSource = customCards || deck.cards;
    if (cardsSource.length === 0) {
      alert("This deck has no cards yet!");
      return;
    }
    let cardsToStudy = customCards
      ? customCards.slice(0, quizCardCount)
      : getDueCards(deck.cards, quizCardCount);

    // Determine which cards need MCQ generation
    const needsMCQ = (card: Flashcard) => {
      // Only for Easy mode (all MCQ) or Default mode (hard cards as MCQ)
      if (mode === "hard") return false;
      if (mode === "easy") return !card.options || card.options.length === 0;
      // Default: MCQ for hard cards (repetitions <= 1 or easeFactor < 2.3)
      const isHard =
        (card.repetitions ?? 0) <= 1 || (card.easeFactor ?? 2.5) < 2.3;
      return isHard && (!card.options || card.options.length === 0);
    };

    const cardsNeedingMCQ = cardsToStudy.filter(needsMCQ);

    let updatedCards = [...cardsToStudy];
    if (cardsNeedingMCQ.length > 0) {
      // Prepare prompt for AI: batch all Q/A pairs
      const aiInput = cardsNeedingMCQ
        .map((c, i) => `Q${i + 1}: ${c.question}\nA${i + 1}: ${c.answer}`)
        .join("\n\n");
      try {
        const aiResult = await parseFlashcardsWithAI(aiInput, API_KEY);
        // Map AI-generated options back to cards
        aiResult.cards.forEach((aiCard, idx) => {
          const orig = cardsNeedingMCQ[idx];
          if (
            aiCard.options &&
            aiCard.options.length === 4 &&
            typeof aiCard.correctIndex === "number"
          ) {
            // Find and update in updatedCards
            const updateIdx = updatedCards.findIndex((c) => c.id === orig.id);
            if (updateIdx !== -1) {
              updatedCards[updateIdx] = {
                ...updatedCards[updateIdx],
                options: aiCard.options,
                correctIndex: aiCard.correctIndex,
              };
            }
          }
        });
      } catch (err) {
        alert(
          "Failed to generate multiple choice options. Please try again.\n" +
            (err instanceof Error ? err.message : ""),
        );
        return;
      }
    }

    // Shuffle if enabled
    if (shuffleMode) {
      updatedCards = [...updatedCards].sort(() => Math.random() - 0.5);
    }

    setSelectedDeck(deck);
    setStudyCards(updatedCards);
    setCurrentCardIndex(0);
    setSessionStats({ correct: 0, forgot: 0, easy: 0 });
    restartTimer();
    if (mode) {
      setDifficultyMode(mode);
      localStorage.setItem("flashcards-difficulty-mode", mode);
    }
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
              onStudyDeck={(deck) =>
                handleStartStudy(deck, undefined, difficultyMode)
              }
              onMoveDeckToFolder={handleMoveDeckToFolder}
              onCreateFolder={handleCreateFolder}
              onUpdateFolder={handleUpdateFolder}
              onDeleteFolder={handleDeleteFolder}
              onReorderDecks={handleReorderDecks}
              difficultyMode={difficultyMode}
              setDifficultyMode={(mode: DifficultyMode) => {
                setDifficultyMode(mode);
                localStorage.setItem("flashcards-difficulty-mode", mode);
              }}
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
              difficultyMode={difficultyMode}
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
          onSuccess={(authUser) => {
            if (authUser) {
              if (authDebugEnabled) {
                const stamp = new Date().toISOString().slice(11, 19);
                setAuthDebugEvents((prev) =>
                  [
                    `${stamp} modal success user=${authUser.uid}`,
                    ...prev,
                  ].slice(0, 12),
                );
              }
              setUser(authUser as User);
              setAuthLoading(false);
            }
            setShowAuthModal(false);
          }}
        />
      )}

      {authDebugEnabled && (
        <div className="fixed left-2 bottom-2 z-9999 max-w-md w-[calc(100vw-1rem)] sm:w-md rounded-lg border border-black/20 bg-white/95 p-2 shadow-xl text-[11px] text-black/80">
          <p className="font-semibold mb-1">Auth Debug</p>
          <div className="max-h-40 overflow-auto space-y-1">
            {authDebugEvents.map((event, index) => (
              <p key={`${event}-${index}`} className="leading-tight">
                {event}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
