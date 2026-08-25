import React, { useState, useEffect } from 'react';
import { getProfileUrl, getPosterUrl } from '../services/tmdb';
import { X, User, Film, Layers, Clapperboard, Tv, Radio, UserCheck, Video } from 'lucide-react';

/**
 * Format subtitle readout under poster frames indicating On Screen Appearance
 */
function formatMediaAppearanceReadout(node) {
  if (node.media_type !== 'tv') {
    return 'Appeared Together On Screen';
  }

  const isTalkShow = node.character?.toLowerCase().includes('self') || 
                     node.title?.toLowerCase().includes('show') || 
                     node.title?.toLowerCase().includes('live');

  if (isTalkShow) {
    return 'Appeared In Separate Episodes';
  }

  if (node.episode_count === 1) {
    return 'Appeared Together On Screen (Same Episode)';
  }

  if (node.episode_count && node.episode_count > 1) {
    return `Appeared Together On Screen (${node.episode_count} Episodes)`;
  }

  return 'Appeared Together On Screen';
}

export default function FilmStrip({ allTakes, startActor, endActor, searchMode = 'actor' }) {
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [currentTakeIndex, setCurrentTakeIndex] = useState(0);

  // Reset take index when new search results arrive
  useEffect(() => {
    setCurrentTakeIndex(0);
  }, [allTakes]);

  if (!allTakes || allTakes.length === 0) return null;

  const currentPathNodes = allTakes[currentTakeIndex] || allTakes[0];

  const isDirectorMode = searchMode === 'director';

  return (
    <div className="w-full max-w-6xl mx-auto my-12 px-4 flex flex-col items-center">
      
      {/* Reel Metadata Header (Centrally Aligned) */}
      <div className="w-full flex flex-col items-center text-center gap-3 mb-6 border-b border-[var(--ash)]/30 pb-6">
        <span className="font-mono text-xs text-[var(--grease)] font-bold uppercase tracking-widest bg-[var(--grease)]/10 px-3.5 py-1 border border-[var(--grease)]/30 inline-flex items-center gap-1.5">
          <Clapperboard className="w-3.5 h-3.5" />
          {isDirectorMode ? 'DIRECTOR COLLABORATOR REEL VERIFIED' : 'SPLICE VERIFIED • REEL ASSEMBLY COMPLETE'}
        </span>

        <h2 className="font-display font-black text-2xl md:text-4xl text-[var(--chalk)] uppercase tracking-wide">
          {isDirectorMode ? 'Shared Actor Collaborator Chain' : 'Co-Starring Chain'}
        </h2>

        <div className="font-mono text-xs bg-[var(--stock)] text-[var(--room)] px-4 py-1.5 font-bold uppercase tracking-wider shadow-md">
          {startActor?.name} ➔ {endActor?.name}
        </div>

        {/* Alternative Takes Switcher Bar */}
        {allTakes.length > 1 && (
          <div className="flex flex-col items-center gap-2 mt-3 pt-3 border-t border-[var(--ash)]/20 w-full max-w-xl">
            <span className="font-mono text-[11px] text-[var(--ash)] uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[var(--grease)]" /> Alternate Cut Re-Slices Available ({allTakes.length} Takes):
            </span>

            <div className="flex flex-wrap justify-center gap-2 font-mono text-xs">
              {allTakes.map((take, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTakeIndex(idx)}
                  className={`px-3 py-1 border font-bold transition-all rounded-none ${
                    currentTakeIndex === idx
                      ? 'border-[var(--grease)] bg-[var(--grease)] text-[var(--chalk)] shadow-md'
                      : 'border-[var(--ash)]/40 bg-[var(--room)] text-[var(--ash)] hover:text-[var(--chalk)] hover:border-[var(--stock)]'
                  }`}
                >
                  [ TAKE {idx + 1} ]
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 35mm Physical Film Strip Container */}
      <div className="film-strip-container w-full">
        
        {/* Top Film Leader Info */}
        <div className="flex items-center justify-between px-6 pb-2 text-[10px] font-mono text-[var(--ash)] tracking-widest border-b border-[var(--ash)]/20 mb-3">
          <span>EASTMAN KODAK 35mm SAFETY FILM</span>
          <span className="text-[var(--grease)] font-bold">REEL TAKE #{currentTakeIndex + 1} OF {allTakes.length}</span>
          <span>REEL FRAME SEQUENCE</span>
        </div>

        {/* Top Sprocket Hole Track */}
        <div className="sprocket-track">
          {Array.from({ length: Math.max(32, currentPathNodes.length * 7) }).map((_, i) => (
            <div
              key={i}
              className={`sprocket-hole ${
                i % 4 === 0 ? 'active' : ''
              }`}
            />
          ))}
        </div>

        {/* Film Frame Row */}
        <div className="film-frames-row">
          {currentPathNodes.map((node, idx) => {
            const isLast = idx === currentPathNodes.length - 1;

            if (node.type === 'director' || node.type === 'actor') {
              const isDirector = node.type === 'director';

              return (
                <React.Fragment key={idx}>
                  <div
                    className="film-frame-wrapper"
                    onClick={() => setSelectedFrame(node)}
                  >
                    {/* Frame Index Badge */}
                    <div className="font-mono text-[9px] text-[var(--ash)] mb-1.5 uppercase tracking-wider">
                      FRAME #{String(idx + 1).padStart(2, '0')}
                    </div>

                    {/* Person Loupe Frame (Circular) */}
                    <div className={`actor-frame ${isDirector ? 'border-[var(--grease)] ring-2 ring-[var(--grease)]/50' : ''}`}>
                      {node.profile_path ? (
                        <img
                          src={getProfileUrl(node.profile_path, 'w185')}
                          alt={node.name}
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--ash)] flex items-center justify-center font-bold text-2xl text-[var(--stock)] font-display">
                          {node.name.charAt(0)}
                        </div>
                      )}

                      {/* Grease Pencil Cut Mark on Final Frame */}
                      {isLast && (
                        <div className="cut-mark">
                          <svg className="w-9 h-9 text-[var(--grease)]" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="8 4" />
                            <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="8" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Person Metadata */}
                    <div className="text-center mt-3 max-w-[130px]">
                      <div className="font-display text-sm font-bold text-[var(--chalk)] leading-snug line-clamp-2">
                        {node.name}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--ash)] uppercase mt-0.5 font-bold">
                        {isDirector
                          ? idx === 0
                            ? '[ START DIRECTOR ]'
                            : '[ TARGET DIRECTOR ]'
                          : node.isSharedActor
                          ? '[ SHARED ACTOR ]'
                          : idx === 0
                          ? '[ START ACTOR ]'
                          : isLast
                          ? '[ TARGET ACTOR ]'
                          : '[ CO-STAR ]'}
                      </div>
                    </div>
                  </div>

                  {/* Connecting Tape between frames */}
                  {!isLast && <div className="tape-connector active" />}
                </React.Fragment>
              );
            }

            // Movie / TV Show Frame (Sharp-cornered rectangle)
            const isTv = node.media_type === 'tv';
            const isTalkShow = isTv && (node.character?.toLowerCase().includes('self') || node.title?.toLowerCase().includes('show') || node.title?.toLowerCase().includes('live'));

            return (
              <React.Fragment key={idx}>
                <div
                  className="film-frame-wrapper"
                  onClick={() => setSelectedFrame(node)}
                >
                  {/* Frame Index Badge */}
                  <div className="font-mono text-[9px] text-[var(--ash)] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <span>CUT #{String(idx).padStart(2, '0')}</span>
                    {isTv ? (
                      <span className="text-[var(--grease)] font-bold">
                        {isTalkShow ? '[SEPARATE GUEST]' : '[TOGETHER ON SCREEN]'}
                      </span>
                    ) : (
                      isDirectorMode && <span className="text-[var(--grease)] font-bold">[DIRECTED FILM]</span>
                    )}
                  </div>

                  <div className="movie-frame">
                    {node.poster_path ? (
                      <img
                        src={getPosterUrl(node.poster_path, 'w342')}
                        alt={node.title}
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--room)] flex flex-col items-center justify-center p-2 text-center border border-[var(--ash)]">
                        {isTv ? <Tv className="w-8 h-8 text-[var(--ash)] mb-2" /> : <Film className="w-8 h-8 text-[var(--ash)] mb-2" />}
                        <span className="font-mono text-xs text-[var(--chalk)]">{node.title}</span>
                      </div>
                    )}
                  </div>

                  {/* Movie / TV Metadata */}
                  <div className="text-center mt-3 max-w-[150px]">
                    <div className="font-mono text-xs font-bold text-[var(--stock)] leading-snug line-clamp-2">
                      {node.title} {node.release_date ? `(${node.release_date.substring(0, 4)})` : ''}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--ash)] mt-1 font-semibold leading-tight">
                      {isDirectorMode ? 'Directed Production' : formatMediaAppearanceReadout(node)}
                    </div>
                  </div>
                </div>

                {/* Connecting Tape between frames */}
                {!isLast && <div className="tape-connector active" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom Sprocket Hole Track */}
        <div className="sprocket-track mt-1">
          {Array.from({ length: Math.max(32, currentPathNodes.length * 7) }).map((_, i) => (
            <div
              key={i}
              className={`sprocket-hole ${
                i % 4 === 0 ? 'active' : ''
              }`}
            />
          ))}
        </div>

        {/* Bottom Leader Footer */}
        <div className="flex items-center justify-between px-6 pt-2 text-[10px] font-mono text-[var(--ash)] tracking-widest border-t border-[var(--ash)]/20 mt-3">
          <span>CLICK ANY FRAME TO INSPECT IN LOUPE</span>
          <span>STEENBECK BENCH READOUT</span>
        </div>

      </div>

      {/* Frame Detail Lightbox Modal */}
      {selectedFrame && (
        <div className="modal-overlay" onClick={() => setSelectedFrame(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedFrame(null)}
            >
              <X className="w-6 h-6" />
            </button>

            {selectedFrame.type === 'director' || selectedFrame.type === 'actor' ? (
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-[var(--room)] flex-shrink-0 shadow-lg">
                  {selectedFrame.profile_path ? (
                    <img
                      src={getProfileUrl(selectedFrame.profile_path, 'w500')}
                      alt={selectedFrame.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--ash)] flex items-center justify-center font-display text-4xl text-[var(--stock)]">
                      {selectedFrame.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-mono text-xs text-[var(--grease)] font-bold uppercase tracking-wider block mb-1">
                    {selectedFrame.type === 'director' ? 'DIRECTOR LOUPE INSPECTION' : 'ACTOR LOUPE INSPECTION'}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-[var(--room)] mb-3">
                    {selectedFrame.name}
                  </h3>
                  <p className="font-mono text-xs text-[var(--room)]/80 leading-relaxed mb-4">
                    TMDB Record ID: <span className="font-bold">#{selectedFrame.id}</span>
                  </p>
                  <a
                    href={`https://www.themoviedb.org/person/${selectedFrame.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--grease)] hover:underline uppercase"
                  >
                    <User className="w-4 h-4" /> View TMDB Profile ➔
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                <div className="w-36 h-52 overflow-hidden border-2 border-[var(--room)] flex-shrink-0 shadow-lg">
                  {selectedFrame.poster_path ? (
                    <img
                      src={getPosterUrl(selectedFrame.poster_path, 'w500')}
                      alt={selectedFrame.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--room)] flex items-center justify-center p-4 text-center">
                      {selectedFrame.media_type === 'tv' ? <Tv className="w-12 h-12 text-[var(--ash)]" /> : <Film className="w-12 h-12 text-[var(--ash)]" />}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-mono text-xs text-[var(--grease)] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    {selectedFrame.media_type === 'tv' ? (
                      <>
                        <Tv className="w-3.5 h-3.5" />
                        <span>TELEVISION REEL CREDIT</span>
                      </>
                    ) : (
                      <>
                        <Film className="w-3.5 h-3.5" />
                        <span>FILM REEL CREDIT</span>
                      </>
                    )}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-[var(--room)] mb-2">
                    {selectedFrame.title} {selectedFrame.release_date ? `(${selectedFrame.release_date.substring(0, 4)})` : ''}
                  </h3>

                  {/* Screen Appearance Context */}
                  <div className="bg-[var(--room)]/10 p-3.5 mb-4 border-l-2 border-[var(--grease)] font-mono text-xs">
                    <div className="font-bold text-[var(--room)] flex items-center gap-1.5 mb-1">
                      {isDirectorMode ? (
                        <>
                          <Video className="w-4 h-4 text-[var(--grease)]" />
                          <span>Directed Production</span>
                        </>
                      ) : selectedFrame.character?.toLowerCase().includes('self') || selectedFrame.title?.toLowerCase().includes('show') || selectedFrame.title?.toLowerCase().includes('live') ? (
                        <>
                          <Radio className="w-4 h-4 text-[var(--grease)]" />
                          <span>Appeared In Separate Episodes / Guest Appearances</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 text-[var(--grease)]" />
                          <span>Appeared Together On Screen</span>
                        </>
                      )}
                    </div>

                    <div className="text-[var(--room)]/80 text-[11px] leading-relaxed pt-1">
                      {isDirectorMode
                        ? '• Directed Film Credit: Production directed by the selected auteur.'
                        : selectedFrame.character?.toLowerCase().includes('self') || selectedFrame.title?.toLowerCase().includes('show') || selectedFrame.title?.toLowerCase().includes('live')
                        ? '• Notice: Both actors appeared as guests on separate episodes/dates of this show.'
                        : selectedFrame.episode_count
                        ? `• Shared Screen Credit: Both actors co-starred together on screen across ${selectedFrame.episode_count} episode(s).`
                        : '• Shared Screen Credit: Both actors co-starred together on screen in this production.'}
                    </div>
                  </div>

                  <a
                    href={`https://www.themoviedb.org/${selectedFrame.media_type || 'movie'}/${selectedFrame.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--grease)] hover:underline uppercase"
                  >
                    <Film className="w-4 h-4" /> View TMDB Record ➔
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
