import type { Deck, Folder } from "../types";

export const STORAGE_KEYS = {
    DECKS: "flashcard-decks",
    FOLDERS: "flashcard-folders",
} as const;

/**
 * Parse a deck from JSON storage format, converting date strings to Date objects
 */
export function parseDeckFromStorage(deck: any): Deck {
    return {
        ...deck,
        createdAt: new Date(deck.createdAt),
        cards: deck.cards.map((card: any) => ({
            ...card,
            nextReview: new Date(card.nextReview),
            lastReview: card.lastReview ? new Date(card.lastReview) : null,
        })),
    };
}

/**
 * Parse a folder from JSON storage format, converting date strings to Date objects
 */
export function parseFolderFromStorage(folder: any): Folder {
    return {
        ...folder,
        createdAt: new Date(folder.createdAt),
    };
}

/**
 * Load decks from localStorage
 */
export function loadDecksFromStorage(): Deck[] {
    const savedDecks = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (!savedDecks) return [];

    try {
        return JSON.parse(savedDecks).map(parseDeckFromStorage);
    } catch (e) {
        console.error("Failed to parse saved decks:", e);
        return [];
    }
}

/**
 * Load folders from localStorage
 */
export function loadFoldersFromStorage(): Folder[] {
    const savedFolders = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    if (!savedFolders) return [];

    try {
        return JSON.parse(savedFolders).map(parseFolderFromStorage);
    } catch (e) {
        console.error("Failed to parse saved folders:", e);
        return [];
    }
}

/**
 * Save decks to localStorage
 */
export function saveDecksToStorage(decks: Deck[]): void {
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
}

/**
 * Save folders to localStorage
 */
export function saveFoldersToStorage(folders: Folder[]): void {
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
}
