import { Flower2, Star, Heart } from "lucide-react";

export function DecorativeElements() {
  return (
    <div className="flex justify-around mb-2 flex-shrink-0">
      <Flower2 className="text-pink-300 w-4 h-4 md:w-5 md:h-5" />
      <Star className="text-yellow-300 fill-yellow-300 w-3 h-3 md:w-4 md:h-4" />
      <Heart className="text-red-300 fill-red-300 w-3.5 h-3.5 md:w-4 md:h-4" />
      <Flower2 className="text-purple-300 w-4 h-4 md:w-5 md:h-5" />
      <Star className="text-blue-300 fill-blue-300 w-3 h-3 md:w-4 md:h-4" />
    </div>
  );
}
