import { useState, useMemo, Fragment } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { FolderPlus } from "lucide-react";

import type { Deck, Folder } from "../types";
import { DeckCard } from "./deck/DeckCard";
import { DroppableFolder } from "./deck/DroppableFolder";
import { SortableItem } from "./deck/SortableItem";
import { FolderModal } from "./modals/FolderModal";
import { EmptyState } from "./common/EmptyState";

// Root drop zone component for moving decks out of folders
function RootDropZone({ isActive }: { isActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "root-zone" });

  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={`mb-3 p-4 border-2 border-dashed rounded-xl text-center text-sm transition-all ${
        isOver
          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
          : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
      }`}
    >
      Drop here to remove from folder
    </div>
  );
}

interface HomeViewProps {
  decks: Deck[];
  folders: Folder[];
  onDeleteDeck: (deckId: string) => void;
  onViewDeck: (deck: Deck) => void;
  onStudyDeck: (deck: Deck) => void;
  onMoveDeckToFolder: (deckId: string, folderId: string | null) => void;
  onCreateFolder: (name: string, color: string) => void;
  onUpdateFolder: (folderId: string, name: string, color: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onReorderDecks: (reorderedIds: string[], folderId: string | null) => void;
}

export function HomeView({
  decks,
  folders,
  onDeleteDeck,
  onViewDeck,
  onStudyDeck,
  onMoveDeckToFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onReorderDecks,
}: HomeViewProps) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors with mobile-friendly touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Organize decks by folder
  const { rootDecks, decksByFolder } = useMemo(() => {
    const root: Deck[] = [];
    const byFolder: Record<string, Deck[]> = {};

    // Initialize empty arrays for all folders
    folders.forEach((f) => {
      byFolder[f.id] = [];
    });

    decks.forEach((deck) => {
      if (deck.folderId && byFolder[deck.folderId]) {
        byFolder[deck.folderId].push(deck);
      } else {
        root.push(deck);
      }
    });

    // Sort by order
    root.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    Object.values(byFolder).forEach((folderDecks) => {
      folderDecks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    return { rootDecks: root, decksByFolder: byFolder };
  }, [decks, folders]);

  // Sort folders by order
  const sortedFolders = useMemo(
    () => [...folders].sort((a, b) => a.order - b.order),
    [folders],
  );

  // Get the active deck being dragged
  const activeDeck = useMemo(
    () => decks.find((d) => d.id === activeId),
    [decks, activeId],
  );

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Skip if dropping on self
    if (activeIdStr === overIdStr) return;

    // Check if we're dragging a deck
    const draggedDeck = decks.find((d) => d.id === activeIdStr);
    if (!draggedDeck) return;

    // Dropping onto root zone - move out of folder
    if (overIdStr === "root-zone") {
      if (draggedDeck.folderId) {
        onMoveDeckToFolder(activeIdStr, null);
      }
      return;
    }

    // Dropping onto a folder
    if (overIdStr.startsWith("folder-")) {
      const targetFolderId = overIdStr.replace("folder-", "");
      onMoveDeckToFolder(activeIdStr, targetFolderId);
      // Auto-expand folder when dropping into it
      setExpandedFolders((prev) => new Set([...prev, targetFolderId]));
      return;
    }

    // Dropping onto another deck - reorder within same container
    const overDeck = decks.find((d) => d.id === overIdStr);
    if (overDeck) {
      // Determine which list we're reordering
      const sourceFolderId = draggedDeck.folderId;
      const targetFolderId = overDeck.folderId;

      // If different folders, move to target folder
      if (sourceFolderId !== targetFolderId) {
        onMoveDeckToFolder(activeIdStr, targetFolderId ?? null);
        return;
      }

      // Same folder - reorder
      const currentList =
        sourceFolderId === null || sourceFolderId === undefined
          ? rootDecks
          : decksByFolder[sourceFolderId] || [];

      const oldIndex = currentList.findIndex((d) => d.id === activeIdStr);
      const newIndex = currentList.findIndex((d) => d.id === overIdStr);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(currentList, oldIndex, newIndex);
        onReorderDecks(
          reordered.map((d) => d.id),
          sourceFolderId ?? null,
        );
      }
    }
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setShowFolderModal(true);
  };

  const handleSaveFolder = (name: string, color: string) => {
    if (editingFolder) {
      onUpdateFolder(editingFolder.id, name, color);
    } else {
      onCreateFolder(name, color);
    }
    setEditingFolder(null);
  };

  const handleCloseModal = () => {
    setShowFolderModal(false);
    setEditingFolder(null);
  };

  const isEmpty = decks.length === 0 && folders.length === 0;

  return (
    <div className="space-y-3">
      {/* New Folder button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowFolderModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          <span className="hidden sm:inline">New Folder</span>
        </button>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Root drop zone - visible when dragging from folder */}
          <RootDropZone isActive={!!activeId && !!activeDeck?.folderId} />

          {/* Main grid with folders and decks - folders expand inline */}
          <SortableContext
            items={[
              ...sortedFolders.map((f) => `folder-${f.id}`),
              ...rootDecks.map((d) => d.id),
            ]}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
              {/* Interleave folders with their expanded content */}
              {sortedFolders.map((folder) => {
                const folderDecks = decksByFolder[folder.id] || [];
                const isExpanded = expandedFolders.has(folder.id);

                return (
                  <Fragment key={folder.id}>
                    <DroppableFolder
                      folder={folder}
                      decks={folderDecks}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleFolderExpand(folder.id)}
                      onEdit={handleEditFolder}
                      onDelete={onDeleteFolder}
                    />
                    {/* Expanded folder content inline */}
                    {isExpanded && (
                      <div
                        key={`expanded-${folder.id}`}
                        className="col-span-full p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed"
                        style={{ borderColor: folder.color }}
                      >
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                          <span style={{ color: folder.color }}>●</span>
                          {folder.name} contents
                        </div>
                        {folderDecks.length > 0 ? (
                          <SortableContext
                            items={folderDecks.map((d) => d.id)}
                            strategy={rectSortingStrategy}
                          >
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                              {folderDecks.map((deck) => (
                                <SortableItem key={deck.id} id={deck.id}>
                                  <DeckCard
                                    deck={deck}
                                    onDelete={onDeleteDeck}
                                    onView={onViewDeck}
                                    onStudy={onStudyDeck}
                                  />
                                </SortableItem>
                              ))}
                            </div>
                          </SortableContext>
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                            Drag decks here to add them to this folder
                          </p>
                        )}
                      </div>
                    )}
                  </Fragment>
                );
              })}

              {/* Root-level decks */}
              {rootDecks.map((deck) => (
                <SortableItem key={deck.id} id={deck.id}>
                  <DeckCard
                    deck={deck}
                    onDelete={onDeleteDeck}
                    onView={onViewDeck}
                    onStudy={onStudyDeck}
                  />
                </SortableItem>
              ))}
            </div>
          </SortableContext>

          {/* Drag overlay for visual feedback */}
          <DragOverlay dropAnimation={null}>
            {activeDeck && (
              <div className="opacity-90 rotate-2 scale-105 shadow-xl pointer-events-none">
                <DeckCard
                  deck={activeDeck}
                  onDelete={() => {}}
                  onView={() => {}}
                  onStudy={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Folder Modal */}
      <FolderModal
        isOpen={showFolderModal}
        onClose={handleCloseModal}
        onSave={handleSaveFolder}
        folder={editingFolder}
      />
    </div>
  );
}
