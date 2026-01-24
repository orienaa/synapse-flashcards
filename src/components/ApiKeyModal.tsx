import { useState } from "react";
import { Brain } from "lucide-react";

interface ApiKeyModalProps {
  onSave: (key: string) => void;
  onClose: () => void;
}

export function ApiKeyModal({ onSave, onClose }: ApiKeyModalProps) {
  const [tempApiKey, setTempApiKey] = useState("");

  const handleSave = () => {
    if (!tempApiKey.trim()) return;
    onSave(tempApiKey);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border-4 border-pink-200">
        <div className="p-4 border-b border-pink-100">
          <h3 className="text-lg md:text-xl text-purple-600 font-medium flex items-center gap-2">
            <Brain className="text-pink-400 w-5 h-5" />
            Enter API Key
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-purple-500 text-sm">
            To use AI-powered flashcard generation, please enter your Anthropic API key.
            You can get one at{" "}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 underline"
            >
              console.anthropic.com
            </a>
          </p>
          <input
            type="password"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-3 py-2 rounded-lg border-2 border-pink-200 focus:border-purple-400 focus:outline-none text-sm text-purple-700 placeholder-purple-300"
          />
        </div>
        <div className="p-4 border-t border-pink-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border-2 border-purple-200 text-purple-600 font-medium text-sm hover:bg-purple-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!tempApiKey.trim()}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white font-medium text-sm hover:from-pink-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Save Key 💖
          </button>
        </div>
      </div>
    </div>
  );
}
