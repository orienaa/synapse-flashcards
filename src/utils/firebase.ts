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
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    type Unsubscribe,
} from "firebase/firestore";
import type { Deck } from "../types";

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
        createdAt: deck.createdAt instanceof Date ? deck.createdAt.toISOString() : deck.createdAt,
        cards: deck.cards.map((card) => ({
            ...card,
            nextReview: card.nextReview instanceof Date ? card.nextReview.toISOString() : card.nextReview,
            lastReview: card.lastReview instanceof Date ? card.lastReview?.toISOString() : card.lastReview,
        })),
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
