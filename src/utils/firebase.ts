import { initializeApp } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User,
} from "firebase/auth";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDocs,
    getDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    type Unsubscribe,
} from "firebase/firestore";
import type { Deck, Folder } from "../types";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBV0ksBZG63HlBu04beIxD5u0Yyiw8zuOQ",
    authDomain: "ai-flashcard-41d6a.firebaseapp.com",
    projectId: "ai-flashcard-41d6a",
    storageBucket: "ai-flashcard-41d6a.firebasestorage.app",
    messagingSenderId: "777634659993",
    appId: "1:777634659993:web:89302f8998fba7362cc208",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

// Auth functions
export async function signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
    return signInWithPopup(auth, googleProvider);
}

export async function signOut() {
    return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}

// Firestore functions for decks
function getUserDecksCollection(userId: string) {
    return collection(db, "users", userId, "decks");
}

export async function saveDeckToCloud(userId: string, deck: Deck) {
    const deckRef = doc(db, "users", userId, "decks", deck.id);
    await setDoc(deckRef, {
        ...deck,
        folderId: deck.folderId ?? null,
        order: deck.order ?? 0,
        createdAt: deck.createdAt instanceof Date ? deck.createdAt.toISOString() : deck.createdAt,
        cards: deck.cards.map((card) => {
            // Build card object without undefined values (Firebase doesn't accept undefined)
            const cardData: Record<string, unknown> = {
                id: card.id,
                question: card.question,
                answer: card.answer,
                interval: card.interval,
                easeFactor: card.easeFactor,
                repetitions: card.repetitions,
                nextReview: card.nextReview instanceof Date ? card.nextReview.toISOString() : card.nextReview,
                lastReview: card.lastReview instanceof Date ? card.lastReview?.toISOString() : card.lastReview ?? null,
            };
            // Only include optional fields if they have values
            if (card.options !== undefined) {
                cardData.options = card.options;
            }
            if (card.correctIndex !== undefined) {
                cardData.correctIndex = card.correctIndex;
            }
            return cardData;
        }),
    });
}

export async function deleteCloudDeck(userId: string, deckId: string) {
    const deckRef = doc(db, "users", userId, "decks", deckId);
    await deleteDoc(deckRef);
}

export async function fetchDecksFromCloud(userId: string): Promise<Deck[]> {
    const decksRef = getUserDecksCollection(userId);
    const snapshot = await getDocs(decksRef);

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            createdAt: new Date(data.createdAt),
            cards: data.cards.map((card: any) => ({
                ...card,
                nextReview: new Date(card.nextReview),
                lastReview: card.lastReview ? new Date(card.lastReview) : null,
            })),
        } as Deck;
    });
}

// Real-time sync listener
export function subscribeToDecks(
    userId: string,
    callback: (decks: Deck[]) => void
): Unsubscribe {
    const decksRef = getUserDecksCollection(userId);
    const q = query(decksRef, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const decks = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: new Date(data.createdAt),
                cards: data.cards.map((card: any) => ({
                    ...card,
                    nextReview: new Date(card.nextReview),
                    lastReview: card.lastReview ? new Date(card.lastReview) : null,
                })),
            } as Deck;
        });
        callback(decks);
    });
}

// User settings (streak data, preferences)
export interface UserSettings {
    streak: {
        currentStreak: number;
        longestStreak: number;
        lastStudyDate: string | null;
        totalStudyDays: number;
    };
    preferences?: {
        quizCardCount: number;
        shuffleMode: boolean;
    };
    deletedExampleDeckIds?: string[];
}

// Get deleted example deck ids for a user (from Firestore user-settings)
export async function getDeletedExampleDeckIdsCloud(userId: string): Promise<Set<string>> {
    const settings = await getUserSettings(userId);
    if (settings && Array.isArray(settings.deletedExampleDeckIds)) {
        return new Set(settings.deletedExampleDeckIds);
    }
    return new Set();
}

// Add a deleted example deck id for a user (Firestore user-settings)
export async function addDeletedExampleDeckIdCloud(userId: string, deckId: string): Promise<void> {
    const settings = await getUserSettings(userId);
    const ids = settings && Array.isArray(settings.deletedExampleDeckIds) ? new Set(settings.deletedExampleDeckIds) : new Set();
    ids.add(deckId);
    await saveUserSettings(userId, { ...settings, deletedExampleDeckIds: Array.from(ids) } as UserSettings);
}

// Remove a deleted example deck id for a user (Firestore user-settings)
export async function removeDeletedExampleDeckIdCloud(userId: string, deckId: string): Promise<void> {
    const settings = await getUserSettings(userId);
    const ids = settings && Array.isArray(settings.deletedExampleDeckIds) ? new Set(settings.deletedExampleDeckIds) : new Set();
    ids.delete(deckId);
    await saveUserSettings(userId, { ...settings, deletedExampleDeckIds: Array.from(ids) } as UserSettings);
}

export async function saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
    const settingsRef = doc(db, "users", userId, "settings", "user-settings");
    await setDoc(settingsRef, settings, { merge: true });
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
    const settingsRef = doc(db, "users", userId, "settings", "user-settings");
    const snapshot = await getDoc(settingsRef);
    if (snapshot.exists()) {
        return snapshot.data() as UserSettings;
    }
    return null;
}

export function subscribeToUserSettings(
    userId: string,
    callback: (settings: UserSettings | null) => void
): Unsubscribe {
    const settingsRef = doc(db, "users", userId, "settings", "user-settings");
    return onSnapshot(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data() as UserSettings);
        } else {
            callback(null);
        }
    });
}

// Firestore functions for folders
function getUserFoldersCollection(userId: string) {
    return collection(db, "users", userId, "folders");
}

export async function saveFolderToCloud(userId: string, folder: Folder) {
    const folderRef = doc(db, "users", userId, "folders", folder.id);
    await setDoc(folderRef, {
        ...folder,
        createdAt: folder.createdAt instanceof Date ? folder.createdAt.toISOString() : folder.createdAt,
    });
}

export async function deleteCloudFolder(userId: string, folderId: string) {
    const folderRef = doc(db, "users", userId, "folders", folderId);
    await deleteDoc(folderRef);
}

export function subscribeToFolders(
    userId: string,
    callback: (folders: Folder[]) => void
): Unsubscribe {
    const foldersRef = getUserFoldersCollection(userId);
    const q = query(foldersRef, orderBy("order", "asc"));

    return onSnapshot(q, (snapshot) => {
        const folders = snapshot.docs.map((docSnapshot) => {
            const data = docSnapshot.data();
            return {
                ...data,
                id: docSnapshot.id,
                createdAt: new Date(data.createdAt),
            } as Folder;
        });
        callback(folders);
    });
}
