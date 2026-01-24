import { Brain } from "lucide-react";

export function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-8 md:py-12">
      <Brain className="text-purple-300 w-16 h-16 md:w-20 md:h-20 mb-4" />
      <p className="text-purple-400 text-lg md:text-xl">No decks yet!</p>
      <p className="text-purple-300 text-sm md:text-base">
        Create your first deck to start studying 💖
      </p>
    </div>
  );
}
