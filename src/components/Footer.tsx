import { Heart, Star, Flower2 } from "lucide-react";

export function Footer() {
  return (
    <div className="flex justify-center gap-3 md:gap-4 mt-3 md:mt-4 flex-shrink-0">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-pink-200/50 flex items-center justify-center">
        <Heart className="text-pink-400 fill-pink-400 w-5 h-5 md:w-6 md:h-6" />
      </div>
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-200/50 flex items-center justify-center">
        <Star className="text-purple-400 fill-purple-400 w-5 h-5 md:w-6 md:h-6" />
      </div>
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-200/50 flex items-center justify-center">
        <Flower2 className="text-blue-400 w-5 h-5 md:w-6 md:h-6" />
      </div>
    </div>
  );
}
