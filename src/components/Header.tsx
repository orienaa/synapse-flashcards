import { useState, useRef, useEffect } from "react";
import { LogIn, LogOut, User, Settings, Brain } from "lucide-react";
import type { User as FirebaseUser } from "firebase/auth";

interface HeaderProps {
  user?: FirebaseUser | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  quizCardCount: number;
  onQuizCardCountChange: (count: number) => void;
}

export function Header({
  user,
  onSignIn,
  onSignOut,
  quizCardCount,
  onQuizCardCountChange,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

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
          <Brain className="text-pink-400 w-4 h-4 md:w-5 md:h-5" />
          <h1 className="text-lg md:text-xl text-purple-600 font-medium">
            Synapse
          </h1>
          {user && (
            <span className="text-purple-400 text-xs md:text-sm hidden sm:inline">
              — Welcome back!
            </span>
          )}
          {!user && (
            <span className="text-purple-400 text-xs md:text-sm hidden sm:inline">
              — Study smarter ✨
            </span>
          )}
        </div>

        {/* Right: Settings and Auth */}
        <div className="flex items-center gap-2">
          {/* Settings Menu */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg hover:bg-purple-100 transition-colors text-purple-500"
            >
              <Settings className="w-4 h-4" />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border-2 border-pink-200 p-3 z-50 min-w-48">
                <p className="text-xs text-purple-600 font-medium mb-2">
                  Quiz Settings
                </p>
                <label className="flex items-center justify-between gap-3">
                  <span className="text-xs text-purple-500">
                    Cards per quiz:
                  </span>
                  <select
                    value={quizCardCount}
                    onChange={(e) =>
                      onQuizCardCountChange(Number(e.target.value))
                    }
                    className="text-xs border border-pink-200 rounded px-2 py-1 text-purple-600 bg-pink-50"
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
