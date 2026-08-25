import React from 'react';
import { HelpCircle, Film, Users, Video, Sparkles } from 'lucide-react';

export default function Header({ searchMode, onSelectMode, onOpenExplainer }) {
  return (
    <header className="w-full border-b border-[var(--ash)]/30 py-8 px-4 md:px-12 bg-[var(--room)] relative overflow-hidden flex flex-col items-center justify-center text-center">
      
      {/* Top Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--grease)] to-transparent opacity-80" />

      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center gap-5 w-full">
        
        {/* Centered Eyebrow Badge */}
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-[var(--ash)]/10 border border-[var(--ash)]/30 rounded-none font-mono text-[11px] uppercase tracking-widest text-[var(--ash)] shadow-sm mx-auto">
          <Film className="w-3.5 h-3.5 text-[var(--grease)] animate-pulse" />
          <span>Steenbeck Workbench No. 35 • Film Graph Inspector</span>
        </div>

        {/* Centered Hero Wordmark */}
        <h1 className="font-display font-black text-3xl sm:text-4xl md:text-6xl tracking-wider text-[var(--chalk)] uppercase leading-none text-center w-full">
          Six Degrees <span className="text-[var(--grease)] italic font-serif">of</span> Cinema
        </h1>

        {/* Mode Switcher Tabs (Actor vs Director) */}
        <div className="flex flex-wrap justify-center items-center gap-3 pt-1 w-full">
          <button
            onClick={() => onSelectMode('actor')}
            className={`flex items-center justify-center gap-2.5 px-6 py-2.5 font-mono text-xs font-bold uppercase transition-all rounded-none shadow-md ${
              searchMode === 'actor'
                ? 'bg-[var(--grease)] text-[var(--chalk)] border-2 border-[var(--chalk)] ring-2 ring-[var(--grease)]/50'
                : 'bg-[var(--room)] text-[var(--ash)] border border-[var(--ash)]/40 hover:text-[var(--chalk)] hover:border-[var(--stock)] hover:bg-[var(--ash)]/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ACTOR ➔ ACTOR REELS</span>
            {searchMode === 'actor' && <Sparkles className="w-3.5 h-3.5 text-[var(--chalk)]" />}
          </button>

          <button
            onClick={() => onSelectMode('director')}
            className={`flex items-center justify-center gap-2.5 px-6 py-2.5 font-mono text-xs font-bold uppercase transition-all rounded-none shadow-md ${
              searchMode === 'director'
                ? 'bg-[var(--grease)] text-[var(--chalk)] border-2 border-[var(--chalk)] ring-2 ring-[var(--grease)]/50'
                : 'bg-[var(--room)] text-[var(--ash)] border border-[var(--ash)]/40 hover:text-[var(--chalk)] hover:border-[var(--stock)] hover:bg-[var(--ash)]/10'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>DIRECTOR ➔ DIRECTOR REELS</span>
            {searchMode === 'director' && <Sparkles className="w-3.5 h-3.5 text-[var(--chalk)]" />}
          </button>
        </div>

        {/* Centered Subtitle */}
        <p className="font-mono text-xs md:text-sm text-[var(--ash)] max-w-xl leading-relaxed text-center mx-auto">
          {searchMode === 'director'
            ? 'Trace shared actor collaborators connecting any two film directors across auteur filmographies.'
            : 'Trace the shortest co-starring reel chain connecting any two actors through 35mm film credits.'}
        </p>

        {/* Centered Action Triggers */}
        <div className="flex items-center justify-center gap-4 pt-1 font-mono text-xs w-full">
          <button
            onClick={onOpenExplainer}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-[var(--ash)] text-[var(--chalk)] hover:border-[var(--stock)] hover:text-[var(--stock)] transition-colors rounded-none bg-[var(--room)] shadow-sm"
            title="How this works"
          >
            <HelpCircle className="w-4 h-4 text-[var(--ash)]" />
            <span>[ how it works ]</span>
          </button>
        </div>

      </div>
    </header>
  );
}
