import { useState, useEffect, useCallback } from "react";

export interface QuizSettings {
    quizCardCount: number;
    shuffleMode: boolean;
}

const STORAGE_KEY = "flashcards-settings";

const DEFAULT_SETTINGS: QuizSettings = {
    quizCardCount: 20,
    shuffleMode: false,
};

function loadSettings(): QuizSettings {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
            };
        }
    } catch (e) {
        console.error("Failed to load settings:", e);
    }
    return DEFAULT_SETTINGS;
}

function saveSettings(settings: QuizSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save settings:", e);
    }
}

export function useSettings() {
    const [settings, setSettings] = useState<QuizSettings>(loadSettings);

    // Save to localStorage whenever settings change
    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    const setQuizCardCount = useCallback((count: number) => {
        setSettings((prev) => ({ ...prev, quizCardCount: count }));
    }, []);

    const setShuffleMode = useCallback((enabled: boolean) => {
        setSettings((prev) => ({ ...prev, shuffleMode: enabled }));
    }, []);

    return {
        quizCardCount: settings.quizCardCount,
        shuffleMode: settings.shuffleMode,
        setQuizCardCount,
        setShuffleMode,
    };
}
