import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal } from "lucide-react";

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
}

export function DraggableItem({ id, children }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group touch-none">
      {/* Visible drag handle bar at top */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 hover:bg-purple-300 dark:hover:bg-purple-600 cursor-grab active:cursor-grabbing transition-all z-10 shadow-sm"
        aria-label="Drag to reorder"
      >
        <GripHorizontal className="w-3 h-3 text-gray-500 dark:text-gray-400" />
      </div>
      {children}
    </div>
  );
}
