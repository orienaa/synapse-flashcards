import { useState, useEffect, useCallback, useRef } from "react";

export function useStudyTimer() {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const start = useCallback(() => {
        setIsRunning(true);
    }, []);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback(() => {
        setElapsedSeconds(0);
        setIsRunning(false);
    }, []);

    const restart = useCallback(() => {
        setElapsedSeconds(0);
        setIsRunning(true);
    }, []);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = window.setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);

    const formatTime = useCallback((totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }, []);

    return {
        elapsedSeconds,
        isRunning,
        formattedTime: formatTime(elapsedSeconds),
        start,
        pause,
        reset,
        restart,
    };
}
