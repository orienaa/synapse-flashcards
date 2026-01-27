import { useState, useEffect } from "react";
import { X, Folder as FolderIcon } from "lucide-react";
import { FOLDER_COLORS } from "../../types";
import type { Folder } from "../../types";

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  folder?: Folder | null;
}

export function FolderModal({
  isOpen,
  onClose,
  onSave,
  folder,
}: FolderModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(FOLDER_COLORS[0].value);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setColor(folder.color);
    } else {
      setName("");
      setColor(FOLDER_COLORS[0].value);
    }
  }, [folder, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave(trimmedName, color);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {folder ? "Edit Folder" : "New Folder"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Folder"
              maxLength={50}
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform hover:scale-110 ${
                    color === c.value
                      ? "ring-2 ring-offset-2 ring-gray-800 dark:ring-white dark:ring-offset-gray-800"
                      : ""
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  <FolderIcon
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Preview
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <FolderIcon
                className="w-6 h-6 flex-shrink-0"
                style={{ color }}
                fill={color}
              />
              <span className="text-gray-700 dark:text-gray-200 font-medium truncate">
                {name || "Untitled Folder"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {folder ? "Save Changes" : "Create Folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
