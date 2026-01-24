// Flashcard interface with spaced repetition data
export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    // Multiple choice support (optional)
    options?: string[]; // Array of choices (including the correct answer)
    correctIndex?: number; // Index of correct answer in options array
    // Spaced repetition fields
    interval: number; // Days until next review
    easeFactor: number; // Difficulty multiplier (2.5 default)
    repetitions: number; // Number of successful reviews
    nextReview: Date; // When to show this card again
    lastReview: Date | null;
}

// Deck interface
export interface Deck {
    id: string;
    name: string;
    cards: Flashcard[];
    createdAt: Date;
}

export type View = "home" | "create" | "study" | "deck-view";
export type StudyResponse = "forgot" | "correct" | "easy";

export interface SessionStats {
    correct: number;
    forgot: number;
    easy: number;
}

export interface ParsedCard {
    question: string;
    answer: string;
    options?: string[]; // Multiple choice options
    correctIndex?: number; // Index of correct answer
}
