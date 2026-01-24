import { Heart, Star, LogIn, LogOut, User } from "lucide-react";
import type { User as FirebaseUser } from "firebase/auth";

interface HeaderProps {
  user?: FirebaseUser | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export function Header({ user, onSignIn, onSignOut }: HeaderProps) {
  return (
    <div className="text-center mb-3 md:mb-4 flex-shrink-0 relative">
      {/* Auth buttons */}
      <div className="absolute right-0 top-0">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-purple-500 text-xs">
              <User className="w-4 h-4" />
              <span className="max-w-32 truncate">
                {user.email || user.displayName}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1 px-2 py-1 rounded bg-pink-100 text-pink-500 text-xs hover:bg-pink-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white text-xs hover:from-pink-500 hover:to-purple-500 transition-all shadow-md"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mb-1">
        <Heart className="text-pink-400 fill-pink-400 w-5 h-5 md:w-6 md:h-6" />
        <h1 className="text-xl md:text-2xl lg:text-3xl text-purple-600 font-medium">
          Synapse
        </h1>
        <Star className="text-yellow-400 fill-yellow-400 w-5 h-5 md:w-6 md:h-6" />
      </div>
      <p className="text-purple-400 text-sm md:text-base">
        {user ? `Welcome back! 💖` : "Study smarter with love! ✨"}
      </p>
    </div>
  );
}
