import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Plus, Tag } from "lucide-react";
import type { Flashcard } from "../../types";

interface EditCardModalProps {
  card: Flashcard | null; // null = creating new card
  onClose: () => void;
  onSave: (cardData: {
    question: string;
    answer: string;
    options?: string[];
    correctIndex?: number;
    tags?: string[];
  }) => void;
  onDelete?: () => void;
  existingTags?: string[]; // All tags used in the deck for suggestions
}

export function EditCardModal({
  card,
  onClose,
  onSave,
  onDelete,
  existingTags = [],
}: EditCardModalProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const isNewCard = card === null;

  // Filter suggestions based on input
  const tagSuggestions = existingTags.filter(
    (t) =>
      t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t),
  );

  useEffect(() => {
    if (card) {
      setQuestion(card.question);
      setAnswer(card.answer);
      setTags(card.tags || []);
      if (card.options && card.options.length > 0) {
        setIsMultipleChoice(true);
        setOptions(card.options);
        setCorrectIndex(card.correctIndex ?? 0);
      } else {
        setIsMultipleChoice(false);
        setOptions(["", "", "", ""]);
        setCorrectIndex(0);
      }
    } else {
      // New card defaults
      setQuestion("");
      setAnswer("");
      setTags([]);
      setIsMultipleChoice(false);
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);
    }
  }, [card]);

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) return;

    onSave({
      question: question.trim(),
      answer: answer.trim(),
      options: isMultipleChoice ? options.filter((o) => o.trim()) : undefined,
      correctIndex: isMultipleChoice ? correctIndex : undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags([...tags, normalizedTag]);
    }
    setTagInput("");
    setShowTagSuggestions(false);
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);

    // Auto-update answer if correct option is changed
    if (index === correctIndex) {
      setAnswer(value);
    }
  };

  const handleCorrectIndexChange = (index: number) => {
    setCorrectIndex(index);
    // Update answer to match selected option
    if (options[index]) {
      setAnswer(options[index]);
    }
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return; // Minimum 2 options
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (correctIndex >= newOptions.length) {
      setCorrectIndex(newOptions.length - 1);
    } else if (correctIndex > index) {
      setCorrectIndex(correctIndex - 1);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto border-4 border-pink-200">
        {/* Header */}
        <div className="p-4 border-b border-pink-100 flex items-center justify-between">
          <h3 className="text-lg text-purple-600 font-medium">
            {isNewCard ? "✨ Add New Card" : "✏️ Edit Card"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-purple-100 transition-colors"
          >
            <X className="text-purple-400 w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Question */}
          <div>
            <label className="block text-sm text-purple-600 font-medium mb-1">
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border-2 border-pink-200 focus:border-purple-400 focus:outline-none text-sm text-purple-700 placeholder-purple-300 resize-none"
            />
          </div>

          {/* Multiple Choice Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="multipleChoice"
              checked={isMultipleChoice}
              onChange={(e) => setIsMultipleChoice(e.target.checked)}
              className="w-4 h-4 text-purple-500 rounded border-pink-300 focus:ring-purple-400"
            />
            <label
              htmlFor="multipleChoice"
              className="text-sm text-purple-600 cursor-pointer"
            >
              Multiple Choice Question
            </label>
          </div>

          {/* Answer / Options */}
          {isMultipleChoice ? (
            <div>
              <label className="block text-sm text-purple-600 font-medium mb-2">
                Options (select correct answer)
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCorrectIndexChange(index)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        correctIndex === index
                          ? "bg-green-500 text-white"
                          : "bg-purple-100 text-purple-500 hover:bg-purple-200"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </button>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      placeholder={`Option ${String.fromCharCode(65 + index)}...`}
                      className="flex-1 px-3 py-2 rounded-lg border-2 border-pink-200 focus:border-purple-400 focus:outline-none text-sm text-purple-700 placeholder-purple-300"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 flex items-center gap-1 text-sm text-purple-500 hover:text-purple-600"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              )}
              <p className="text-xs text-purple-400 mt-2">
                💡 Click a letter to mark it as the correct answer
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-purple-600 font-medium mb-1">
                Answer
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter the answer..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border-2 border-pink-200 focus:border-purple-400 focus:outline-none text-sm text-purple-700 placeholder-purple-300 resize-none"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm text-purple-600 font-medium mb-1">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-purple-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowTagSuggestions(true);
                }}
                onKeyDown={handleTagKeyDown}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() =>
                  setTimeout(() => setShowTagSuggestions(false), 200)
                }
                placeholder="Add tags..."
                className="w-full px-3 py-2 rounded-lg border-2 border-pink-200 focus:border-purple-400 focus:outline-none text-sm text-purple-700 placeholder-purple-300"
              />
              {showTagSuggestions && tagSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-pink-200 rounded-lg shadow-lg max-h-32 overflow-auto z-10">
                  {tagSuggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="w-full text-left px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-purple-400 mt-1">
              Press Enter to add a tag
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pink-100 flex gap-2">
          {!isNewCard && onDelete && (
            <button
              onClick={() => onDelete()}
              className="px-4 py-2 rounded-lg border-2 border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border-2 border-purple-200 text-purple-600 text-sm hover:bg-purple-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!question.trim() || !answer.trim()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white text-sm hover:from-pink-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isNewCard ? "Add Card" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
