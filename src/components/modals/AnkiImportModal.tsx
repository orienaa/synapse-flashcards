import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Layers, Loader2, Check, AlertCircle } from "lucide-react";
import { AnkiDeck, AnkiImportResult, parseAnkiFile } from "../../utils/anki";

interface AnkiImportModalProps {
  onClose: () => void;
  onImport: (decks: AnkiDeck[]) => void;
}

export function AnkiImportModal({ onClose, onImport }: AnkiImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ankiResult, setAnkiResult] = useState<AnkiImportResult | null>(null);
  const [ankiLoading, setAnkiLoading] = useState(false);
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnkiLoading(true);
    setAnkiResult(null);
    setImportStatus(null);

    try {
      const result = await parseAnkiFile(file);
      setAnkiResult(result);
      // Select all decks by default
      setSelectedDecks(new Set(result.decks.map((d) => d.name)));

      if (result.warnings.length > 0) {
        setImportStatus({
          type: "warning",
          message: result.warnings[0],
        });
      }
    } catch (error) {
      setImportStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to parse Anki file",
      });
    } finally {
      setAnkiLoading(false);
    }
  };

  const toggleDeckSelection = (deckName: string) => {
    setSelectedDecks((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(deckName)) {
        newSet.delete(deckName);
      } else {
        newSet.add(deckName);
      }
      return newSet;
    });
  };

  const handleImport = () => {
    if (!ankiResult) return;

    const decksToImport = ankiResult.decks.filter((d: { name: string }) =>
      selectedDecks.has(d.name),
    );

    if (decksToImport.length === 0) {
      setImportStatus({
        type: "error",
        message: "Please select at least one deck to import.",
      });
      return;
    }

    const totalCards = decksToImport.reduce(
      (sum: number, d: { cards: any[] }) => sum + d.cards.length,
      0,
    );
    onImport(decksToImport);
    setImportStatus({
      type: "success",
      message: `Successfully imported ${decksToImport.length} deck(s) with ${totalCards} cards!`,
    });
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-purple-100 dark:border-purple-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-purple-700 dark:text-purple-300">
              Import from Anki
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Import flashcard decks from Anki. Supports{" "}
                <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">
                  .apkg
                </code>{" "}
                deck packages and{" "}
                <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">
                  .txt
                </code>{" "}
                text exports.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".apkg,.colpkg,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={ankiLoading}
                className="w-full py-4 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg text-purple-500 dark:text-purple-400 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {ankiLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Parsing Anki file...
                  </>
                ) : (
                  <>
                    <Layers className="w-5 h-5" />
                    Choose Anki File (.apkg, .txt)
                  </>
                )}
              </button>

              <p className="text-xs text-purple-400 dark:text-purple-500 text-center">
                Export from Anki: File → Export → select "Anki Deck Package
                (.apkg)"
              </p>
            </div>

            {/* Anki Import Preview */}
            {ankiResult && (
              <div className="space-y-3">
                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                    Found {ankiResult.decks.length} deck(s) with{" "}
                    {ankiResult.totalCards} total cards
                  </p>

                  <div className="space-y-2 max-h-48 overflow-auto">
                    {ankiResult.decks.map((deck: AnkiDeck) => (
                      <label
                        key={deck.name}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDecks.has(deck.name)}
                          onChange={() => toggleDeckSelection(deck.name)}
                          className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300 truncate">
                            {deck.name}
                          </p>
                          <p className="text-xs text-purple-500 dark:text-purple-400">
                            {deck.cards.length} cards
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sample cards preview */}
                {selectedDecks.size > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      Sample cards from selected deck(s):
                    </p>
                    <div className="space-y-1 max-h-24 overflow-auto">
                      {ankiResult.decks
                        .filter((d: { name: string }) =>
                          selectedDecks.has(d.name),
                        )
                        .flatMap((d: { cards: any[] }) => d.cards.slice(0, 2))
                        .slice(0, 4)
                        .map(
                          (
                            card: { question: string; answer: string },
                            i: number,
                          ) => (
                            <p
                              key={i}
                              className="text-xs text-green-600 dark:text-green-400 truncate"
                            >
                              {i + 1}. {card.question} → {card.answer}
                            </p>
                          ),
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Messages */}
            {importStatus && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  importStatus.type === "success"
                    ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                    : importStatus.type === "warning"
                      ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300"
                      : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                }`}
              >
                {importStatus.type === "success" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{importStatus.message}</span>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!ankiResult || selectedDecks.size === 0}
              className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg font-medium hover:from-pink-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              Import {selectedDecks.size} Deck(s)
            </button>

            <p className="text-xs text-purple-400 dark:text-purple-500 text-center">
              Note: Media files (images, audio) are not imported. HTML
              formatting is stripped.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
