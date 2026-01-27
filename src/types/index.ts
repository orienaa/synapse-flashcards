// Flashcard interface with spaced repetition data
export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    // Multiple choice support (optional)
    options?: string[]; // Array of choices (including the correct answer)
    correctIndex?: number; // Index of correct answer in options array
    // Tags for organization (optional)
    tags?: string[];
    // Spaced repetition fields
    interval: number; // Days until next review
    easeFactor: number; // Difficulty multiplier (2.5 default)
    repetitions: number; // Number of successful reviews
    nextReview: Date; // When to show this card again
    lastReview: Date | null;
}

// Folder interface for organizing decks
export interface Folder {
    id: string;
    name: string;
    color: string; // Hex color
    order: number;
    createdAt: Date;
}

// Preset folder colors
export const FOLDER_COLORS = [
    { name: "Pink", value: "#ec4899" },
    { name: "Purple", value: "#a855f7" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Green", value: "#22c55e" },
    { name: "Yellow", value: "#eab308" },
    { name: "Orange", value: "#f97316" },
    { name: "Red", value: "#ef4444" },
] as const;

// Deck interface
export interface Deck {
    id: string;
    name: string;
    cards: Flashcard[];
    createdAt: Date;
    folderId?: string | null; // null or undefined = root level
    order?: number; // For drag-and-drop sorting
}

export type View = "home" | "create" | "study" | "deck-view" | "session-complete";
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
