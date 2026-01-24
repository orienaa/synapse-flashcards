import type { Flashcard, StudyResponse } from "../types";

// Simple SM-2 inspired algorithm
export function calculateNextReview(
    card: Flashcard,
    response: StudyResponse
): Flashcard {
    const newCard = { ...card };
    newCard.lastReview = new Date();

    if (response === "forgot") {
        // Reset progress
        newCard.repetitions = 0;
        newCard.interval = 0; // Show again this session
        newCard.easeFactor = Math.max(1.3, newCard.easeFactor - 0.2);
    } else if (response === "correct") {
        newCard.repetitions += 1;
        if (newCard.repetitions === 1) {
            newCard.interval = 1;
        } else if (newCard.repetitions === 2) {
            newCard.interval = 3;
        } else {
            newCard.interval = Math.round(newCard.interval * newCard.easeFactor);
        }
        newCard.easeFactor = Math.max(1.3, newCard.easeFactor - 0.05);
    } else if (response === "easy") {
        newCard.repetitions += 1;
        if (newCard.repetitions === 1) {
            newCard.interval = 4;
        } else {
            newCard.interval = Math.round(newCard.interval * newCard.easeFactor * 1.3);
        }
        newCard.easeFactor = Math.min(2.5, newCard.easeFactor + 0.1);
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newCard.interval);
    newCard.nextReview = nextDate;

    return newCard;
}

// Get cards for review - prioritizes due cards, then includes upcoming cards sorted by date
export function getDueCards(cards: Flashcard[], maxCards: number = 20): Flashcard[] {
    // Sort ALL cards by next review date (closest first)
    const sortedCards = [...cards].sort(
        (a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime()
    );

    // Return up to maxCards
    return sortedCards.slice(0, maxCards);
}

// Create a new flashcard with default spaced repetition values
export function createFlashcard(
    question: string,
    answer: string,
    options?: string[],
    correctIndex?: number
): Flashcard {
    return {
        id: Date.now().toString() + Math.random().toString(36),
        question,
        answer,
        options,
        correctIndex,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: new Date(),
        lastReview: null,
    };
}

// Get deck statistics
export interface DeckStats {
    total: number;
    due: number; // Cards due for review today
    learning: number; // Cards with 1-2 repetitions (still learning)
    mastered: number; // Cards with 3+ repetitions
    new: number; // Cards never reviewed
}

export interface DetailedDeckStats extends DeckStats {
    // Cards that need more work (low ease factor or frequently forgotten)
    strugglingCards: Flashcard[];
    // Cards due soon (next 7 days)
    upcomingCards: { card: Flashcard; daysUntilDue: number }[];
    // Average ease factor (difficulty indicator)
    avgEaseFactor: number;
    // Total reviews completed
    totalReviews: number;
    // Retention rate estimate
    retentionRate: number;
    // Cards by status
    cardsByStatus: {
        overdue: Flashcard[];
        dueToday: Flashcard[];
        dueTomorrow: Flashcard[];
        dueThisWeek: Flashcard[];
        mastered: Flashcard[];
    };
}

export function getDeckStats(cards: Flashcard[]): DeckStats {
    const now = new Date();

    let due = 0;
    let learning = 0;
    let mastered = 0;
    let newCards = 0;

    for (const card of cards) {
        if (card.lastReview === null) {
            newCards++;
        } else if (card.repetitions >= 3) {
            mastered++;
        } else {
            learning++;
        }

        if (new Date(card.nextReview) <= now) {
            due++;
        }
    }

    return {
        total: cards.length,
        due,
        learning,
        mastered,
        new: newCards,
    };
}

export function getDetailedDeckStats(cards: Flashcard[]): DetailedDeckStats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const basicStats = getDeckStats(cards);

    // Cards with low ease factor (struggling)
    const strugglingCards = cards
        .filter((card) => card.easeFactor < 2.0 && card.lastReview !== null)
        .sort((a, b) => a.easeFactor - b.easeFactor);

    // Cards due in next 7 days
    const upcomingCards: { card: Flashcard; daysUntilDue: number }[] = [];
    for (const card of cards) {
        const dueDate = new Date(card.nextReview);
        if (dueDate > now && dueDate <= nextWeek) {
            const daysUntilDue = Math.ceil(
                (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            upcomingCards.push({ card, daysUntilDue });
        }
    }
    upcomingCards.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    // Average ease factor
    const reviewedCards = cards.filter((c) => c.lastReview !== null);
    const avgEaseFactor =
        reviewedCards.length > 0
            ? reviewedCards.reduce((sum, c) => sum + c.easeFactor, 0) / reviewedCards.length
            : 2.5;

    // Total reviews (sum of all repetitions)
    const totalReviews = cards.reduce((sum, c) => sum + c.repetitions, 0);

    // Retention rate estimate based on ease factors and repetitions
    const retentionRate =
        reviewedCards.length > 0
            ? (reviewedCards.filter((c) => c.easeFactor >= 2.0).length / reviewedCards.length) * 100
            : 100;

    // Cards by status
    const overdue: Flashcard[] = [];
    const dueToday: Flashcard[] = [];
    const dueTomorrow: Flashcard[] = [];
    const dueThisWeek: Flashcard[] = [];
    const mastered: Flashcard[] = [];

    for (const card of cards) {
        const dueDate = new Date(card.nextReview);
        const dueDateDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        if (card.repetitions >= 5 && card.easeFactor >= 2.3) {
            mastered.push(card);
        } else if (dueDateDay < today) {
            overdue.push(card);
        } else if (dueDateDay.getTime() === today.getTime()) {
            dueToday.push(card);
        } else if (dueDateDay.getTime() === tomorrow.getTime()) {
            dueTomorrow.push(card);
        } else if (dueDateDay <= nextWeek) {
            dueThisWeek.push(card);
        }
    }

    return {
        ...basicStats,
        strugglingCards,
        upcomingCards,
        avgEaseFactor,
        totalReviews,
        retentionRate,
        cardsByStatus: {
            overdue,
            dueToday,
            dueTomorrow,
            dueThisWeek,
            mastered,
        },
    };
}

// Get card difficulty label
export function getCardDifficulty(card: Flashcard): {
    label: string;
    color: string;
    emoji: string;
} {
    if (card.lastReview === null) {
        return { label: "New", color: "text-orange-500", emoji: "🆕" };
    }
    if (card.easeFactor >= 2.4) {
        return { label: "Easy", color: "text-green-500", emoji: "⭐" };
    }
    if (card.easeFactor >= 2.0) {
        return { label: "Good", color: "text-blue-500", emoji: "👍" };
    }
    if (card.easeFactor >= 1.6) {
        return { label: "Hard", color: "text-yellow-600", emoji: "💪" };
    }
    return { label: "Struggling", color: "text-red-500", emoji: "🔥" };
}

// Get card status label
export function getCardStatus(card: Flashcard): {
    label: string;
    color: string;
} {
    const now = new Date();
    const dueDate = new Date(card.nextReview);

    if (card.lastReview === null) {
        return { label: "Not started", color: "bg-gray-100 text-gray-600" };
    }
    if (dueDate <= now) {
        return { label: "Due now", color: "bg-pink-100 text-pink-600" };
    }

    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil === 1) {
        return { label: "Due tomorrow", color: "bg-orange-100 text-orange-600" };
    }
    if (daysUntil <= 7) {
        return { label: `Due in ${daysUntil} days`, color: "bg-yellow-100 text-yellow-700" };
    }
    if (card.repetitions >= 5) {
        return { label: "Mastered", color: "bg-green-100 text-green-600" };
    }
    return { label: `Review in ${daysUntil}d`, color: "bg-blue-100 text-blue-600" };
}
