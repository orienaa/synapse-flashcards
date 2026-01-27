import { useDroppable } from "@dnd-kit/core";

interface DroppableRootZoneProps {
  children: React.ReactNode;
}

export function DroppableRootZone({ children }: DroppableRootZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root-zone",
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] rounded-xl p-2 transition-all ${
        isOver
          ? "bg-purple-100 dark:bg-purple-900/30 border-2 border-dashed border-purple-400 dark:border-purple-500"
          : ""
      }`}
    >
      {children}
      {isOver && (
        <div className="text-center text-sm text-purple-500 dark:text-purple-400 py-2">
          Drop here to move to root level
        </div>
      )}
    </div>
  );
}
