import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

const THEME_KEY = "flashcards_theme";

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check localStorage first
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === "light" || saved === "dark") {
            return saved;
        }
        // Check system preference
        if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }
        return "light";
    });

    useEffect(() => {
        // Apply theme to document
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            const saved = localStorage.getItem(THEME_KEY);
            // Only auto-switch if user hasn't manually set a preference
            if (!saved) {
                setTheme(e.matches ? "dark" : "light");
            }
        };
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    }, []);

    const isDark = theme === "dark";

    return { theme, isDark, toggleTheme, setTheme };
}
