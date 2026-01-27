import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Download,
  Upload,
  FileJson,
  Check,
  AlertCircle,
  FileText,
  Layers,
  Loader2,
} from "lucide-react";
import type { Deck, Flashcard } from "../../types";
import { AnkiDeck, AnkiImportResult, parseAnkiFile } from "../../utils/anki";

interface ExportImportModalProps {
  deck: Deck;
  onClose: () => void;
  onImport: (cards: Omit<Flashcard, "id">[]) => void;
  onImportAnkiDecks?: (decks: AnkiDeck[]) => void;
}

export function ExportImportModal({
  deck,
  onClose,
  onImport,
  onImportAnkiDecks,
}: ExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<
    "export" | "import" | "bulk" | "anki"
  >("export");
  const [importText, setImportText] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkFormat, setBulkFormat] = useState<"tab" | "semicolon" | "newline">(
    "tab",
  );
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ankiFileInputRef = useRef<HTMLInputElement>(null);

  // Anki import state
  const [ankiResult, setAnkiResult] = useState<AnkiImportResult | null>(null);
  const [ankiLoading, setAnkiLoading] = useState(false);
  const [selectedAnkiDecks, setSelectedAnkiDecks] = useState<Set<string>>(
    new Set(),
  );

  const handleExport = () => {
    const exportData = {
      name: deck.name,
      exportedAt: new Date().toISOString(),
      cards: deck.cards.map((card) => ({
        question: card.question,
        answer: card.answer,
        options: card.options,
        correctIndex: card.correctIndex,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_flashcards.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  const parseImportData = (text: string): Omit<Flashcard, "id">[] | null => {
    try {
      const data = JSON.parse(text);

      // Handle exported deck format
      const cardsArray = data.cards || data;

      if (!Array.isArray(cardsArray)) {
        throw new Error("Invalid format: expected an array of cards");
      }

      const now = new Date();
      return cardsArray.map((card: Record<string, unknown>) => {
        if (!card.question || !card.answer) {
          throw new Error("Each card must have 'question' and 'answer' fields");
        }
        return {
          question: String(card.question),
          answer: String(card.answer),
          options: Array.isArray(card.options)
            ? card.options.map(String)
            : undefined,
          correctIndex:
            typeof card.correctIndex === "number"
              ? card.correctIndex
              : undefined,
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          nextReview: now,
          lastReview: null,
        };
      });
    } catch (error) {
      return null;
    }
  };

  // Parse bulk text format (tab-separated, semicolon-separated, or newline pairs)
  const parseBulkText = (text: string): Omit<Flashcard, "id">[] | null => {
    const lines = text
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    if (lines.length === 0) return null;

    const now = new Date();
    const cards: Omit<Flashcard, "id">[] = [];

    if (bulkFormat === "newline") {
      // Pairs of lines: question, answer, question, answer...
      for (let i = 0; i < lines.length - 1; i += 2) {
        const question = lines[i].trim();
        const answer = lines[i + 1]?.trim();
        if (question && answer) {
          cards.push({
            question,
            answer,
            interval: 0,
            easeFactor: 2.5,
            repetitions: 0,
            nextReview: now,
            lastReview: null,
          });
        }
      }
    } else {
      // Tab or semicolon separated
      const separator = bulkFormat === "tab" ? "\t" : ";";
      for (const line of lines) {
        const parts = line.split(separator).map((p) => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          cards.push({
            question: parts[0],
            answer: parts[1],
            interval: 0,
            easeFactor: 2.5,
            repetitions: 0,
            nextReview: now,
            lastReview: null,
          });
        }
      }
    }

    return cards.length > 0 ? cards : null;
  };

  const handleImport = () => {
    const cards = parseImportData(importText);
    if (!cards || cards.length === 0) {
      setImportStatus({
        type: "error",
        message:
          "Invalid JSON format. Expected an array with 'question' and 'answer' fields.",
      });
      return;
    }

    onImport(cards);
    setImportStatus({
      type: "success",
      message: `Successfully imported ${cards.length} cards!`,
    });
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleBulkImport = () => {
    const cards = parseBulkText(bulkText);
    if (!cards || cards.length === 0) {
      setImportStatus({
        type: "error",
        message: "Could not parse any cards. Check your format and try again.",
      });
      return;
    }

    onImport(cards);
    setImportStatus({
      type: "success",
      message: `Successfully imported ${cards.length} cards!`,
    });
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // Anki file upload handler
  const handleAnkiFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnkiLoading(true);
    setAnkiResult(null);
    setImportStatus(null);

    try {
      const result = await parseAnkiFile(file);
      setAnkiResult(result);
      // Select all decks by default
      setSelectedAnkiDecks(new Set(result.decks.map((d) => d.name)));

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

  // Toggle deck selection for Anki import
  const toggleAnkiDeckSelection = (deckName: string) => {
    setSelectedAnkiDecks((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(deckName)) {
        newSet.delete(deckName);
      } else {
        newSet.add(deckName);
      }
      return newSet;
    });
  };

  // Handle Anki import
  const handleAnkiImport = () => {
    if (!ankiResult || !onImportAnkiDecks) return;

    const decksToImport = ankiResult.decks.filter((d: { name: string }) =>
      selectedAnkiDecks.has(d.name),
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
    onImportAnkiDecks(decksToImport);
    setImportStatus({
      type: "success",
      message: `Successfully imported ${decksToImport.length} deck(s) with ${totalCards} cards!`,
    });
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const previewCards = parseImportData(importText);
  const previewBulkCards = parseBulkText(bulkText);

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-purple-100 dark:border-purple-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-purple-700 dark:text-purple-300">
            Export / Import Cards
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-purple-100 dark:border-purple-800">
          <button
            onClick={() => setActiveTab("export")}
            className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "export"
                ? "text-purple-600 dark:text-purple-300 border-b-2 border-purple-500"
                : "text-purple-400 hover:text-purple-500"
            }`}
          >
            <Download className="w-4 h-4 inline mr-1" />
            Export
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "import"
                ? "text-purple-600 border-b-2 border-purple-500"
                : "text-purple-400 hover:text-purple-500"
            }`}
          >
            <FileJson className="w-4 h-4 inline mr-1" />
            JSON
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "bulk"
                ? "text-purple-600 border-b-2 border-purple-500"
                : "text-purple-400 hover:text-purple-500"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1" />
            Bulk
          </button>
          {onImportAnkiDecks && (
            <button
              onClick={() => setActiveTab("anki")}
              className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === "anki"
                  ? "text-purple-600 border-b-2 border-purple-500"
                  : "text-purple-400 hover:text-purple-500"
              }`}
            >
              <Layers className="w-4 h-4 inline mr-1" />
              Anki
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === "export" ? (
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileJson className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="font-medium text-purple-700">{deck.name}</p>
                    <p className="text-sm text-purple-500">
                      {deck.cards.length} cards
                    </p>
                  </div>
                </div>
                <p className="text-sm text-purple-600">
                  Export this deck as a JSON file. You can share it with others
                  or use it as a backup.
                </p>
              </div>

              <button
                onClick={handleExport}
                className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg font-medium hover:from-pink-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download JSON
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-purple-600">
                  Import cards from a JSON file or paste JSON directly.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-500 hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choose JSON File
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-600">
                  Or paste JSON:
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setImportStatus(null);
                  }}
                  placeholder={`[
  { "question": "What is 2+2?", "answer": "4" },
  { "question": "Capital of France?", "answer": "Paris" }
]`}
                  className="w-full h-32 p-3 border-2 border-purple-200 rounded-lg text-sm font-mono resize-none focus:border-purple-400 focus:outline-none"
                />
              </div>

              {/* Preview */}
              {previewCards && previewCards.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-700 mb-2">
                    ✓ Preview: {previewCards.length} cards detected
                  </p>
                  <div className="max-h-24 overflow-auto space-y-1">
                    {previewCards.slice(0, 3).map((card, i) => (
                      <p key={i} className="text-xs text-green-600 truncate">
                        {i + 1}. {card.question}
                      </p>
                    ))}
                    {previewCards.length > 3 && (
                      <p className="text-xs text-green-500">
                        ...and {previewCards.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {importStatus && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    importStatus.type === "success"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
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
                disabled={!previewCards || previewCards.length === 0}
                className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg font-medium hover:from-pink-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                Import {previewCards?.length || 0} Cards
              </button>
            </div>
          )}

          {activeTab === "bulk" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-purple-600">
                  Paste multiple flashcards at once. Choose your format:
                </p>

                {/* Format selector */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setBulkFormat("tab")}
                    className={`flex-1 py-2 px-3 text-xs rounded-lg border-2 transition-colors ${
                      bulkFormat === "tab"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-purple-200 text-purple-500 hover:border-purple-300"
                    }`}
                  >
                    Tab separated
                  </button>
                  <button
                    onClick={() => setBulkFormat("semicolon")}
                    className={`flex-1 py-2 px-3 text-xs rounded-lg border-2 transition-colors ${
                      bulkFormat === "semicolon"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-purple-200 text-purple-500 hover:border-purple-300"
                    }`}
                  >
                    Semicolon (;)
                  </button>
                  <button
                    onClick={() => setBulkFormat("newline")}
                    className={`flex-1 py-2 px-3 text-xs rounded-lg border-2 transition-colors ${
                      bulkFormat === "newline"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-purple-200 text-purple-500 hover:border-purple-300"
                    }`}
                  >
                    Line pairs
                  </button>
                </div>

                <textarea
                  value={bulkText}
                  onChange={(e) => {
                    setBulkText(e.target.value);
                    setImportStatus(null);
                  }}
                  placeholder={
                    bulkFormat === "tab"
                      ? "Question 1\tAnswer 1\nQuestion 2\tAnswer 2"
                      : bulkFormat === "semicolon"
                        ? "Question 1; Answer 1\nQuestion 2; Answer 2"
                        : "Question 1\nAnswer 1\nQuestion 2\nAnswer 2"
                  }
                  className="w-full h-40 p-3 border-2 border-purple-200 rounded-lg text-sm font-mono resize-none focus:border-purple-400 focus:outline-none"
                />

                <p className="text-xs text-purple-400">
                  {bulkFormat === "tab" &&
                    "Tip: Copy from Excel/Sheets with two columns"}
                  {bulkFormat === "semicolon" &&
                    "Format: question ; answer (one per line)"}
                  {bulkFormat === "newline" &&
                    "Alternating lines: question, answer, question, answer..."}
                </p>
              </div>

              {/* Preview */}
              {previewBulkCards && previewBulkCards.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-700 mb-2">
                    ✓ Preview: {previewBulkCards.length} cards detected
                  </p>
                  <div className="max-h-24 overflow-auto space-y-1">
                    {previewBulkCards.slice(0, 3).map((card, i) => (
                      <p key={i} className="text-xs text-green-600 truncate">
                        {i + 1}. {card.question} → {card.answer}
                      </p>
                    ))}
                    {previewBulkCards.length > 3 && (
                      <p className="text-xs text-green-500">
                        ...and {previewBulkCards.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {importStatus && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    importStatus.type === "success"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
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
                onClick={handleBulkImport}
                disabled={!previewBulkCards || previewBulkCards.length === 0}
                className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg font-medium hover:from-pink-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                Import {previewBulkCards?.length || 0} Cards
              </button>
            </div>
          )}

          {activeTab === "anki" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-purple-600 dark:text-purple-300">
                  Import flashcards from Anki. Supports{" "}
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
                  ref={ankiFileInputRef}
                  type="file"
                  accept=".apkg,.colpkg,.txt,.tsv"
                  onChange={handleAnkiFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => ankiFileInputRef.current?.click()}
                  disabled={ankiLoading}
                  className="w-full py-3 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg text-purple-500 dark:text-purple-400 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
              </div>

              {/* Anki Import Preview */}
              {ankiResult && (
                <div className="space-y-3">
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                      Found {ankiResult.decks.length} deck(s) with{" "}
                      {ankiResult.totalCards} total cards
                    </p>

                    <div className="space-y-2 max-h-40 overflow-auto">
                      {ankiResult.decks.map((deck: AnkiDeck) => (
                        <label
                          key={deck.name}
                          className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAnkiDecks.has(deck.name)}
                            onChange={() => toggleAnkiDeckSelection(deck.name)}
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
                  {selectedAnkiDecks.size > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                        Sample cards from selected deck(s):
                      </p>
                      <div className="space-y-1 max-h-20 overflow-auto">
                        {ankiResult.decks
                          .filter((d: AnkiDeck) =>
                            selectedAnkiDecks.has(d.name),
                          )
                          .flatMap((d: AnkiDeck) => d.cards.slice(0, 2))
                          .slice(0, 3)
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
                onClick={handleAnkiImport}
                disabled={!ankiResult || selectedAnkiDecks.size === 0}
                className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg font-medium hover:from-pink-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                Import {selectedAnkiDecks.size} Deck(s)
              </button>

              <p className="text-xs text-purple-400 dark:text-purple-500 text-center">
                Note: Media files (images, audio) are not imported. HTML
                formatting is stripped.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
