import { useDroppable } from "@dnd-kit/core";
import type { Folder, Deck } from "../../types";
import { FolderCard } from "./FolderCard";

interface DroppableFolderProps {
  folder: Folder;
  decks: Deck[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (folder: Folder) => void;
  onDelete: (folderId: string) => void;
}

export function DroppableFolder({
  folder,
  decks,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: DroppableFolderProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
  });

  return (
    <div ref={setNodeRef}>
      <FolderCard
        folder={folder}
        decks={decks}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onEdit={onEdit}
        onDelete={onDelete}
        isDropTarget={isOver}
      />
    </div>
  );
}
