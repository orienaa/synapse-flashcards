import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder as FolderIcon,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import type { Folder, Deck } from "../../types";
import { ConfirmDialog } from "../modals/ConfirmDialog";

interface FolderCardProps {
  folder: Folder;
  decks: Deck[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (folder: Folder) => void;
  onDelete: (folderId: string) => void;
  isDropTarget?: boolean;
}

export function FolderCard({
  folder,
  decks,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isDropTarget,
}: FolderCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const deckCount = decks.length;

  // Calculate due cards across all decks in folder
  const totalDue = decks.reduce((sum, deck) => {
    const now = new Date();
    const due = deck.cards.filter((c) => new Date(c.nextReview) <= now).length;
    return sum + due;
  }, 0);

  return (
    <>
      <div
        className={`bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-2.5 border-2 transition-all cursor-pointer ${
          isDropTarget
            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 scale-[1.02] shadow-lg"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          {/* Expand/collapse icon */}
          <div className="text-gray-400 dark:text-gray-500">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>

          {/* Folder icon with color */}
          <FolderIcon
            className="w-5 h-5 flex-shrink-0"
            style={{ color: folder.color }}
            fill={folder.color}
          />

          {/* Folder name */}
          <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
            {folder.name}
          </span>

          {/* Stats */}
          <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
            <span className="text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {deckCount}
            </span>
            {totalDue > 0 && (
              <span className="text-pink-500 dark:text-pink-400">
                ⏰{totalDue}
              </span>
            )}
          </div>

          {/* Menu button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-28">
                  <button
                    onClick={() => {
                      onEdit(folder);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Folder?"
          message={`Delete "${folder.name}"? ${deckCount > 0 ? `The ${deckCount} deck(s) inside will be moved back to the main view.` : ""}`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={() => {
            onDelete(folder.id);
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
