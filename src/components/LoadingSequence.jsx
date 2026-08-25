import React, { useState, useEffect } from 'react';

export default function LoadingSequence({ statusMessage, nodesVisited = 0 }) {
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  // Advance frame indicator to create mechanical projector feeling
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % 6);
    }, 280);
    return () => clearInterval(interval);
  }, []);

  const dummyFrames = [
    { type: 'actor', label: 'Start Actor' },
    { type: 'movie', label: 'Reel Splice 1' },
    { type: 'actor', label: 'Searching Co-star' },
    { type: 'movie', label: 'Reel Splice 2' },
    { type: 'actor', label: 'Target Actor' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-12 px-4 flex flex-col items-center">
      
      {/* Voice Status Label */}
      <div className="flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-[var(--chalk)] mb-6">
        <span className="inline-block w-2.5 h-2.5 bg-[var(--grease)] animate-ping" />
        <span>{statusMessage || 'Threading the reel...'}</span>
        {nodesVisited > 0 && (
          <span className="text-[var(--ash)]">({nodesVisited} nodes scanned)</span>
        )}
      </div>

      {/* Frame-by-Frame Film Strip Assembly */}
      <div className="w-full bg-[#0a0a09] border-y-2 border-[var(--ash)] p-6 shadow-2xl relative overflow-hidden">
        
        {/* Top Sprocket Track */}
        <div className="flex justify-between items-center mb-4 px-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={`sprocket-hole transition-colors duration-150 ${
                i % 6 === activeFrameIndex ? 'active' : ''
              }`}
            />
          ))}
        </div>

        {/* Assembling Frames */}
        <div className="flex items-center justify-center gap-4 py-6 overflow-x-auto min-h-[220px]">
          {dummyFrames.map((frame, idx) => {
            const isAssembled = idx <= activeFrameIndex;
            return (
              <React.Fragment key={idx}>
                {frame.type === 'actor' ? (
                  <div
                    className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                      isAssembled ? 'frame-assembling opacity-100' : 'opacity-20 scale-95'
                    }`}
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-[var(--ash)] bg-[var(--room)] flex items-center justify-center relative overflow-hidden shadow-inner">
                      {isAssembled && (
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--grease)]/20 to-transparent" />
                      )}
                      <span className="font-mono text-xs text-[var(--ash)]">
                        {isAssembled ? `[FRAME ${idx + 1}]` : '...'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[var(--ash)] uppercase">
                      {frame.label}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                      isAssembled ? 'frame-assembling opacity-100' : 'opacity-20 scale-95'
                    }`}
                  >
                    <div className="w-20 h-28 md:w-24 md:h-36 border-2 border-[var(--ash)] bg-[var(--room)] flex items-center justify-center relative overflow-hidden shadow-inner">
                      {isAssembled && (
                        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/80" />
                      )}
                      <span className="font-mono text-[10px] text-[var(--ash)] text-center px-1">
                        {isAssembled ? `[CUT #${idx}]` : '...'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[var(--ash)] uppercase">
                      {frame.label}
                    </span>
                  </div>
                )}

                {/* Splice connector */}
                {idx < dummyFrames.length - 1 && (
                  <div
                    className={`tape-connector ${
                      isAssembled ? 'active' : ''
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom Sprocket Track */}
        <div className="flex justify-between items-center mt-4 px-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={`sprocket-hole transition-colors duration-150 ${
                i % 6 === activeFrameIndex ? 'active' : ''
              }`}
            />
          ))}
        </div>

      </div>

    </div>
  );
}
