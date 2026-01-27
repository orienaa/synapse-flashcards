import { useState, useEffect, useCallback, useRef } from "react";
import {
    saveUserSettings,
    getUserSettings,
} from "../utils/firebase";

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string | null; // ISO date string (YYYY-MM-DD)
    totalStudyDays: number;
    studiedToday: boolean;
}

const STORAGE_KEY = "flashcards-streak";

function getTodayDate(): string {
    return new Date().toISOString().split("T")[0];
}

function getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
}

function processStreakData(data: Omit<StreakData, "studiedToday">): StreakData {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    // Check if streak needs to be reset (missed a day)
    if (data.lastStudyDate && data.lastStudyDate !== today && data.lastStudyDate !== yesterday) {
        // Streak broken - reset current streak but keep longest
        return {
            ...data,
            currentStreak: 0,
            studiedToday: false,
        };
    }

    // Update studiedToday based on lastStudyDate
    return {
        ...data,
        studiedToday: data.lastStudyDate === today,
    };
}

function loadStreakData(): StreakData {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            return processStreakData(data);
        }
    } catch (e) {
        console.error("Failed to load streak data:", e);
    }

    return {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        totalStudyDays: 0,
        studiedToday: false,
    };
}

function saveStreakDataToLocal(data: StreakData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save streak data:", e);
    }
}

export function useStreak(userId?: string | null) {
    const [streakData, setStreakData] = useState<StreakData>(loadStreakData);
    const isInitialized = useRef(false);
    const isSyncing = useRef(false);

    // Sync with Firebase when user is logged in
    useEffect(() => {
        if (!userId) {
            // Not logged in - use localStorage data
            if (isInitialized.current) {
                setStreakData(loadStreakData());
            }
            isInitialized.current = true;
            return;
        }

        // Load from Firebase and merge with local data
        async function syncWithFirebase() {
            isSyncing.current = true;
            try {
                const cloudSettings = await getUserSettings(userId!);
                const localData = loadStreakData();

                if (cloudSettings?.streak) {
                    const cloudStreak = processStreakData({
                        ...cloudSettings.streak,
                        studiedToday: false, // Will be recalculated
                    } as StreakData);

                    // Merge: take the better of local vs cloud
                    const mergedData: StreakData = {
                        currentStreak: Math.max(localData.currentStreak, cloudStreak.currentStreak),
                        longestStreak: Math.max(localData.longestStreak, cloudStreak.longestStreak),
                        totalStudyDays: Math.max(localData.totalStudyDays, cloudStreak.totalStudyDays),
                        // Use the most recent study date
                        lastStudyDate: localData.lastStudyDate && cloudStreak.lastStudyDate
                            ? localData.lastStudyDate > cloudStreak.lastStudyDate
                                ? localData.lastStudyDate
                                : cloudStreak.lastStudyDate
                            : localData.lastStudyDate || cloudStreak.lastStudyDate,
                        studiedToday: false, // Will be recalculated
                    };

                    // Recalculate studiedToday
                    const today = getTodayDate();
                    mergedData.studiedToday = mergedData.lastStudyDate === today;

                    setStreakData(mergedData);
                    saveStreakDataToLocal(mergedData);

                    // Save merged data back to Firebase
                    await saveUserSettings(userId!, {
                        streak: {
                            currentStreak: mergedData.currentStreak,
                            longestStreak: mergedData.longestStreak,
                            lastStudyDate: mergedData.lastStudyDate,
                            totalStudyDays: mergedData.totalStudyDays,
                        },
                    });
                } else {
                    // No cloud data - upload local data
                    await saveUserSettings(userId!, {
                        streak: {
                            currentStreak: localData.currentStreak,
                            longestStreak: localData.longestStreak,
                            lastStudyDate: localData.lastStudyDate,
                            totalStudyDays: localData.totalStudyDays,
                        },
                    });
                }
            } catch (e) {
                console.error("Failed to sync streak with Firebase:", e);
            }
            isSyncing.current = false;
            isInitialized.current = true;
        }

        syncWithFirebase();
    }, [userId]);

    // Check streak status on mount and when date changes
    useEffect(() => {
        const checkStreak = () => {
            setStreakData(loadStreakData());
        };

        // Check at midnight
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const timeUntilMidnight = midnight.getTime() - now.getTime();

        const timeout = setTimeout(() => {
            checkStreak();
            // Then check every 24 hours
            const interval = setInterval(checkStreak, 24 * 60 * 60 * 1000);
            return () => clearInterval(interval);
        }, timeUntilMidnight);

        return () => clearTimeout(timeout);
    }, []);

    const recordStudySession = useCallback(async () => {
        const today = getTodayDate();

        const updateStreak = (prev: StreakData): StreakData => {
            // Already studied today - no change needed
            if (prev.lastStudyDate === today) {
                return prev;
            }

            const yesterday = getYesterdayDate();
            const wasYesterday = prev.lastStudyDate === yesterday;

            // Calculate new streak
            let newStreak: number;
            if (wasYesterday) {
                // Continue streak
                newStreak = prev.currentStreak + 1;
            } else if (prev.lastStudyDate === null) {
                // First time studying
                newStreak = 1;
            } else {
                // Streak was broken, start new one
                newStreak = 1;
            }

            return {
                currentStreak: newStreak,
                longestStreak: Math.max(prev.longestStreak, newStreak),
                lastStudyDate: today,
                totalStudyDays: prev.totalStudyDays + 1,
                studiedToday: true,
            };
        };

        setStreakData((prev) => {
            const newData = updateStreak(prev);
            if (newData !== prev) {
                saveStreakDataToLocal(newData);

                // Sync to Firebase if logged in
                if (userId && !isSyncing.current) {
                    saveUserSettings(userId, {
                        streak: {
                            currentStreak: newData.currentStreak,
                            longestStreak: newData.longestStreak,
                            lastStudyDate: newData.lastStudyDate,
                            totalStudyDays: newData.totalStudyDays,
                        },
                    }).catch((e) => console.error("Failed to sync streak to Firebase:", e));
                }
            }
            return newData;
        });
    }, [userId]);

    const resetStreak = useCallback(async () => {
        const newData: StreakData = {
            currentStreak: 0,
            longestStreak: streakData.longestStreak, // Keep longest
            lastStudyDate: null,
            totalStudyDays: streakData.totalStudyDays, // Keep total
            studiedToday: false,
        };
        saveStreakDataToLocal(newData);
        setStreakData(newData);

        // Sync to Firebase if logged in
        if (userId) {
            try {
                await saveUserSettings(userId, {
                    streak: {
                        currentStreak: newData.currentStreak,
                        longestStreak: newData.longestStreak,
                        lastStudyDate: newData.lastStudyDate,
                        totalStudyDays: newData.totalStudyDays,
                    },
                });
            } catch (e) {
                console.error("Failed to sync streak reset to Firebase:", e);
            }
        }
    }, [streakData.longestStreak, streakData.totalStudyDays, userId]);

    return {
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        totalStudyDays: streakData.totalStudyDays,
        studiedToday: streakData.studiedToday,
        recordStudySession,
        resetStreak,
    };
}
