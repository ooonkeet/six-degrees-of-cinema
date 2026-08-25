import React, { useState } from 'react';
import { X, Key, CheckCircle, ExternalLink } from 'lucide-react';
import { getApiKey, setCustomApiKey } from '../services/tmdb';

export default function ApiKeyModal({ isOpen, onClose, onSaveKey }) {
  const [keyInput, setKeyInput] = useState(getApiKey() || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setCustomApiKey(keyInput);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onSaveKey();
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setKeyInput('');
    setCustomApiKey('');
    onSaveKey();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <button className="modal-close" onClick={onClose}>
          <X className="w-6 h-6" />
        </button>

        <div className="border-b border-[var(--room)]/20 pb-3 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-[var(--grease)]" />
          <div>
            <span className="font-mono text-xs font-bold text-[var(--grease)] uppercase tracking-wider">
              TMDB API CONFIGURATION
            </span>
            <h3 className="font-display text-xl font-bold text-[var(--room)]">
              API Access Key
            </h3>
          </div>
        </div>

        <p className="font-mono text-xs text-[var(--room)]/80 mb-4 leading-relaxed">
          This application connects to The Movie Database (TMDB) to fetch person credits and filmographies. Enter your TMDB v3 API Key below.
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[var(--room)] mb-1">
              TMDB API Key (v3 auth):
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
              className="w-full font-mono text-sm px-3 py-2 border-2 border-[var(--room)] bg-white text-[var(--room)] outline-none focus:border-[var(--grease)]"
              required
            />
          </div>

          <div className="flex items-center justify-between font-mono text-[11px] text-[var(--room)]/70">
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--grease)] font-bold hover:underline"
            >
              Get a free key on TMDB <ExternalLink className="w-3 h-3" />
            </a>

            {keyInput && (
              <button
                type="button"
                onClick={handleClear}
                className="text-red-700 hover:underline font-bold"
              >
                Clear key
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--room)]/20">
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-xs px-4 py-2 text-[var(--room)] hover:underline"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="splicer-btn text-xs py-2 px-5"
            >
              {savedSuccess ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> SAVED
                </span>
              ) : (
                'SAVE API KEY'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
