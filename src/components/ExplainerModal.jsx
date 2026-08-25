import React from 'react';
import { X, Scissors, Layers, Share2 } from 'lucide-react';

export default function ExplainerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <button className="modal-close" onClick={onClose}>
          <X className="w-6 h-6" />
        </button>

        <div className="border-b border-[var(--room)]/20 pb-3 mb-4">
          <span className="font-mono text-xs font-bold text-[var(--grease)] uppercase tracking-wider">
            STEENBECK EDITING MANUAL • SPECIFICATION 01
          </span>
          <h3 className="font-display text-2xl font-bold text-[var(--room)] mt-1">
            How This Workbench Works
          </h3>
        </div>

        {/* Short Plain Language Paragraph */}
        <p className="font-mono text-sm text-[var(--room)] leading-relaxed mb-6">
          Every movie connects the actors who shared its set. This tool builds a live map of those co-starring relationships and runs a shortest-path search between your starting and ending actors — finding the fewest physical film splices needed to link them together.
        </p>

        {/* Tactile Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs pt-2 border-t border-[var(--room)]/20">
          <div className="flex flex-col items-center text-center p-3 bg-black/5">
            <Share2 className="w-5 h-5 text-[var(--grease)] mb-1" />
            <span className="font-bold text-[var(--room)]">Co-Star Graph</span>
            <span className="text-[10px] text-[var(--room)]/70 mt-0.5">Connects actors via shared TMDB film credits</span>
          </div>

          <div className="flex flex-col items-center text-center p-3 bg-black/5">
            <Scissors className="w-5 h-5 text-[var(--grease)] mb-1" />
            <span className="font-bold text-[var(--room)]">Shortest Path</span>
            <span className="text-[10px] text-[var(--room)]/70 mt-0.5">Bidirectional search for minimum degree splices</span>
          </div>

          <div className="flex flex-col items-center text-center p-3 bg-black/5">
            <Layers className="w-5 h-5 text-[var(--grease)] mb-1" />
            <span className="font-bold text-[var(--room)]">Session Cache</span>
            <span className="text-[10px] text-[var(--room)]/70 mt-0.5">Remembers credit lookups for instant re-queries</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="splicer-btn text-xs py-2 px-6"
          >
            RETURN TO WORKBENCH
          </button>
        </div>

      </div>
    </div>
  );
}
