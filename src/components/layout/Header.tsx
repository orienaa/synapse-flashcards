import { useState, useRef, useEffect } from "react";
import {
  LogIn,
  LogOut,
  User,
  Settings,
  Brain,
  Flame,
  Moon,
  Sun,
  Bell,
  Shuffle,
} from "lucide-react";
import type { User as FirebaseUser } from "firebase/auth";

interface HeaderProps {
  user?: FirebaseUser | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  quizCardCount: number;
  onQuizCardCountChange: (count: number) => void;
  shuffleMode: boolean;
  onShuffleModeChange: (enabled: boolean) => void;
  currentStreak: number;
  longestStreak: number;
  studiedToday: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  totalDueCards: number;
}

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
        enabled ? "bg-purple-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function Header({
  user,
  onSignIn,
  onSignOut,
  quizCardCount,
  onQuizCardCountChange,
  shuffleMode,
  onShuffleModeChange,
  currentStreak,
  longestStreak,
  studiedToday,
  isDark,
  onToggleTheme,
  totalDueCards,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showStreakTooltip, setShowStreakTooltip] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef<HTMLDivElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mb-2 md:mb-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Left: Logo and welcome */}
        <div className="flex items-center gap-2">
          <Brain className="text-pink-400 dark:text-pink-300 w-4 h-4 md:w-5 md:h-5" />
          <h1 className="text-lg md:text-xl text-purple-600 dark:text-purple-300 font-medium">
            Synapse
          </h1>
          {user && (
            <span className="text-purple-400 dark:text-purple-400 text-xs md:text-sm hidden sm:inline">
              — Welcome back!
            </span>
          )}
          {!user && (
            <span className="text-purple-400 dark:text-purple-400 text-xs md:text-sm hidden sm:inline">
              — Study smarter ✨
            </span>
          )}
        </div>

        {/* Right: Due Cards Badge, Streak, Settings and Auth */}
        <div className="flex items-center gap-2">
          {/* Due Cards Notification */}
          {totalDueCards > 0 && (
            <div className="relative flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300">
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">
                {totalDueCards > 99 ? "99+" : totalDueCards}
              </span>
              <span className="hidden sm:inline text-xs">due</span>
            </div>
          )}

          {/* Streak Display */}
          <div
            className="relative"
            ref={streakRef}
            onMouseEnter={() => setShowStreakTooltip(true)}
            onMouseLeave={() => setShowStreakTooltip(false)}
          >
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                currentStreak > 0
                  ? studiedToday
                    ? "bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 text-orange-600 dark:text-orange-400"
                    : "bg-orange-50 dark:bg-orange-900/30 text-orange-400 dark:text-orange-500"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
              }`}
            >
              <Flame
                className={`w-4 h-4 ${
                  currentStreak > 0 && studiedToday
                    ? "text-orange-500 animate-pulse"
                    : ""
                }`}
              />
              <span className="text-sm font-medium">{currentStreak}</span>
            </div>
            {showStreakTooltip && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-orange-200 dark:border-orange-700 p-3 z-50 min-w-40 text-xs">
                <p className="font-medium text-orange-600 dark:text-orange-400 mb-2">
                  🔥 Streak Stats
                </p>
                <div className="space-y-1 text-purple-600 dark:text-purple-300">
                  <p>
                    Current: {currentStreak} day{currentStreak !== 1 ? "s" : ""}
                  </p>
                  <p>
                    Longest: {longestStreak} day{longestStreak !== 1 ? "s" : ""}
                  </p>
                  <p className="pt-1 border-t border-orange-100 dark:border-orange-800 text-orange-500 dark:text-orange-400">
                    {studiedToday
                      ? "✓ Studied today!"
                      : "Study to keep your streak!"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Settings Menu */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors text-purple-500 dark:text-purple-300"
            >
              <Settings className="w-4 h-4" />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-pink-200 dark:border-purple-700 p-3 z-50 w-52">
                <p className="text-xs text-purple-600 dark:text-purple-300 font-medium mb-2">
                  Settings
                </p>

                {/* Dark Mode Toggle */}
                <label className="flex items-center justify-between gap-3">
                  <span className="text-xs text-purple-500 dark:text-purple-400 flex items-center gap-1">
                    {isDark ? (
                      <Moon className="w-3 h-3" />
                    ) : (
                      <Sun className="w-3 h-3" />
                    )}
                    Dark mode:
                  </span>
                  <ToggleSwitch enabled={isDark} onToggle={onToggleTheme} />
                </label>

                <div className="my-2 border-t border-pink-100 dark:border-purple-700" />

                <p className="text-xs text-purple-600 dark:text-purple-300 font-medium mb-2">
                  Quiz Settings
                </p>

                <label className="flex items-center justify-between gap-3">
                  <span className="text-xs text-purple-500 dark:text-purple-400">
                    Cards per quiz:
                  </span>
                  <select
                    value={quizCardCount}
                    onChange={(e) =>
                      onQuizCardCountChange(Number(e.target.value))
                    }
                    className="text-xs border border-pink-200 dark:border-purple-600 rounded px-2 py-1 text-purple-600 dark:text-purple-200 bg-pink-50 dark:bg-gray-700"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={999}>All</option>
                  </select>
                </label>

                <label className="flex items-center justify-between gap-3 mt-2">
                  <span className="text-xs text-purple-500 dark:text-purple-400 flex items-center gap-1">
                    <Shuffle className="w-3 h-3" />
                    Shuffle cards:
                  </span>
                  <ToggleSwitch
                    enabled={shuffleMode}
                    onToggle={() => onShuffleModeChange(!shuffleMode)}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Auth buttons */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 text-purple-500 text-xs">
                <User className="w-3.5 h-3.5" />
                <span className="max-w-24 truncate">
                  {user.email || user.displayName}
                </span>
              </div>
              <button
                onClick={onSignOut}
                className="flex items-center gap-1 px-2 py-1 rounded bg-pink-100 text-pink-500 text-xs hover:bg-pink-200 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white text-xs hover:from-pink-500 hover:to-purple-500 transition-all shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
