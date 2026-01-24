import { useState } from "react";
import { X, Sparkles, Brain, Loader2 } from "lucide-react";
import type { ParsedCard } from "../types";
import { parseFlashcardsWithAI } from "../utils/ai";

interface CreateDeckModalProps {
  apiKey: string;
  onClose: () => void;
  onCreate: (name: string, cards: ParsedCard[]) => void;
}

export function CreateDeckModal({
  apiKey,
  onClose,
  onCreate,
}: CreateDeckModalProps) {
  const [newDeckName, setNewDeckName] = useState("");
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);

  const handleParseText = async () => {
    if (!inputText.trim()) return;

    if (!apiKey) {
      alert(
        "API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.",
      );
      return;
    }

    setIsProcessing(true);
    setProcessingStatus("Analyzing text...");
    try {
      const result = await parseFlashcardsWithAI(inputText, apiKey);
      setParsedCards(result.cards);
      setProcessingStatus(`✨ ${result.cards.length} flashcards created!`);
      // Auto-fill the deck name if empty
      if (!newDeckName.trim() && result.title) {
        setNewDeckName(result.title);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to parse text: ${message}`);
      setProcessingStatus("");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreate = () => {
    if (!newDeckName.trim() || parsedCards.length === 0) return;
    onCreate(newDeckName, parsedCards);
  };

  const handleClose = () => {
    setParsedCards([]);
    setInputText("");
    setNewDeckName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto border-4 border-pink-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-pink-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg md:text-xl text-purple-600 font-medium flex items-center gap-2">
              <Sparkles className="text-pink-400 w-5 h-5" />
              Create New Deck
            </h3>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-purple-100 transition-colors"
            >
              <X className="text-purple-400 w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {/* Deck Name */}
          <div>
            <label className="block text-sm text-purple-600 font-medium mb-1">
              Deck Name ✨
            </label>
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="e.g., Biology Chapter 1"
              className="w-full px-3 py-2 rounded-lg border-2 border-pink-200 focus:border-purple-400 focus:outline-none text-sm text-purple-700 placeholder-purple-300"
            />
          </div>

          {/* Input Text */}
          <div>
            <label className="block text-sm text-purple-600 font-medium mb-1">
              Paste Your Study Material 📚
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste any text here - notes, Q&A, definitions, etc. The AI will automatically create flashcards for you!"
              rows={6}
              className="w-full px-3 py-2 rounded-lg border-2 border-pink-200 focus:border-purple-400 focus:outline-none text-sm text-purple-700 placeholder-purple-300 resize-none"
            />
          </div>

          {/* Parse Button */}
          <button
            onClick={handleParseText}
            disabled={!inputText.trim() || isProcessing}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-400 to-blue-400 text-white font-medium text-sm hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Generate Flashcards with AI
              </>
            )}
          </button>

          {/* Processing Status */}
          {processingStatus && (
            <p className="text-center text-sm text-purple-500 font-medium">
              {processingStatus}
            </p>
          )}

          {/* Parsed Cards Preview */}
          {parsedCards.length > 0 && (
            <div>
              <label className="block text-sm text-purple-600 font-medium mb-1">
                Preview ({parsedCards.length} cards) 💖
              </label>
              <div className="max-h-48 overflow-auto space-y-2 border-2 border-pink-100 rounded-lg p-2">
                {parsedCards.map((card, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-2"
                  >
                    <p className="text-purple-700 text-xs md:text-sm font-medium">
                      Q: {card.question}
                    </p>
                    <p className="text-purple-500 text-xs">
                      A: {card.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-pink-100 flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-lg border-2 border-purple-200 text-purple-600 font-medium text-sm hover:bg-purple-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!newDeckName.trim() || parsedCards.length === 0}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white font-medium text-sm hover:from-pink-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Create Deck 💖
          </button>
        </div>
      </div>
    </div>
  );
}
