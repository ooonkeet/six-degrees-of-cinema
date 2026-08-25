import React, { useState, useEffect, useRef } from 'react';
import { searchPerson, getProfileUrl } from '../services/tmdb';
import { Film, ArrowRight, RotateCcw, Sparkles, CheckCircle2, Video, ShieldAlert } from 'lucide-react';

const PRESET_ACTOR_PAIRS = [
  { start: { id: 6384, name: 'Keanu Reeves', profile_path: '/4D0PpPhRjWUdRjWz1vR8g6n0G1E.jpg' }, end: { id: 4724, name: 'Kevin Bacon', profile_path: '/p1pwoTe9v2728c31g5s4K.jpg' } },
  { start: { id: 505710, name: 'Zendaya', profile_path: '/3P37L5yXWz02qRjW21a00N.jpg' }, end: { id: 380, name: 'Robert De Niro', profile_path: '/1a8E0l0K0S7yM0p.jpg' } },
  { start: { id: 1253360, name: 'Pedro Pascal', profile_path: '/mP5s.jpg' }, end: { id: 5064, name: 'Meryl Streep', profile_path: '/x447y5.jpg' } },
  { start: { id: 6193, name: 'Leonardo DiCaprio', profile_path: '/wo2Ws.jpg' }, end: { id: 234352, name: 'Margot Robbie', profile_path: '/eu.jpg' } },
];

const PRESET_DIRECTOR_PAIRS = [
  { start: { id: 138, name: 'Quentin Tarantino', profile_path: '/1gYW6f.jpg' }, end: { id: 1032, name: 'Martin Scorsese', profile_path: '/9U.jpg' } },
  { start: { id: 525, name: 'Christopher Nolan', profile_path: '/xuB.jpg' }, end: { id: 137427, name: 'Denis Villeneuve', profile_path: '/sd.jpg' } },
  { start: { id: 488, name: 'Steven Spielberg', profile_path: '/zA.jpg' }, end: { id: 2710, name: 'James Cameron', profile_path: '/sL.jpg' } },
  { start: { id: 147573, name: 'Greta Gerwig', profile_path: '/w5.jpg' }, end: { id: 5655, name: 'Wes Anderson', profile_path: '/a.jpg' } },
  { start: { id: 240, name: 'Stanley Kubrick', profile_path: '/wA.jpg' }, end: { id: 2636, name: 'Alfred Hitchcock', profile_path: '/bA.jpg' } },
  { start: { id: 7467, name: 'David Fincher', profile_path: '/cA.jpg' }, end: { id: 21684, name: 'Bong Joon-ho', profile_path: '/dA.jpg' } },
];

export default function WorkbenchForm({ searchMode = 'actor', onSubmit, isLoading, hasApiKey, onNeedApiKey }) {
  const [startPerson, setStartPerson] = useState(null);
  const [startQuery, setStartQuery] = useState('');
  const [startResults, setStartResults] = useState([]);
  const [showStartDropdown, setShowStartDropdown] = useState(false);

  const [endPerson, setEndPerson] = useState(null);
  const [endQuery, setEndQuery] = useState('');
  const [endResults, setEndResults] = useState([]);
  const [showEndDropdown, setShowEndDropdown] = useState(false);

  const [validationNotice, setValidationNotice] = useState(null);

  const startRef = useRef(null);
  const endRef = useRef(null);

  const isDirectorMode = searchMode === 'director';
  const presets = isDirectorMode ? PRESET_DIRECTOR_PAIRS : PRESET_ACTOR_PAIRS;

  // Reset inputs when search mode changes
  useEffect(() => {
    setStartPerson(null);
    setStartQuery('');
    setEndPerson(null);
    setEndQuery('');
    setValidationNotice(null);
  }, [searchMode]);

  // Debounced search for Start Person
  useEffect(() => {
    if (!startQuery || startPerson?.name === startQuery) {
      setStartResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchPerson(startQuery, searchMode);
        setStartResults(results);
        setShowStartDropdown(true);
      } catch (err) {
        if (err.message === 'NO_API_KEY') {
          onNeedApiKey();
        }
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [startQuery, startPerson, searchMode, onNeedApiKey]);

  // Debounced search for End Person
  useEffect(() => {
    if (!endQuery || endPerson?.name === endQuery) {
      setEndResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchPerson(endQuery, searchMode);
        setEndResults(results);
        setShowEndDropdown(true);
      } catch (err) {
        if (err.message === 'NO_API_KEY') {
          onNeedApiKey();
        }
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [endQuery, endPerson, searchMode, onNeedApiKey]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (startRef.current && !startRef.current.contains(e.target)) {
        setShowStartDropdown(false);
      }
      if (endRef.current && !endRef.current.contains(e.target)) {
        setShowEndDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStart = (person) => {
    setValidationNotice(null);
    setStartPerson(person);
    setStartQuery(person.name);
    setShowStartDropdown(false);
  };

  const handleSelectEnd = (person) => {
    setValidationNotice(null);
    setEndPerson(person);
    setEndQuery(person.name);
    setShowEndDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationNotice(null);

    if (!hasApiKey) {
      onNeedApiKey();
      return;
    }

    if (startPerson && endPerson) {
      onSubmit(startPerson, endPerson);
    }
  };

  const handlePresetSelect = (preset) => {
    setValidationNotice(null);
    setStartPerson(preset.start);
    setStartQuery(preset.start.name);
    setEndPerson(preset.end);
    setEndQuery(preset.end.name);
  };

  const handleSwap = () => {
    setValidationNotice(null);
    const tempPerson = startPerson;
    const tempQuery = startQuery;
    setStartPerson(endPerson);
    setStartQuery(endQuery);
    setEndPerson(tempPerson);
    setEndQuery(tempQuery);
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-6 px-4 light-table-backlight flex flex-col items-center justify-center">
      
      {/* Centered Form Wrapper */}
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-8 relative z-10 w-full">
        
        {/* Strict Mode Indicator Banner (Centrally Aligned) */}
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-[var(--room)] border border-[var(--ash)]/40 font-mono text-xs text-[var(--chalk)] mx-auto text-center">
          <ShieldAlert className="w-3.5 h-3.5 text-[var(--grease)]" />
          <span>
            {isDirectorMode
              ? 'STRICT MODE: DIRECTOR PAGE • ONLY REGISTERED DIRECTORS ARE SUGGESTED & ACCEPTED'
              : 'STRICT MODE: ACTOR PAGE • ONLY REGISTERED ACTORS ARE SUGGESTED & ACCEPTED'}
          </span>
        </div>

        {/* Validation Notice Alert */}
        {validationNotice && (
          <div className="w-full p-3 border-2 border-[var(--grease)] bg-[var(--grease)]/10 text-[var(--chalk)] font-mono text-xs text-center font-bold">
            {validationNotice}
          </div>
        )}

        {/* Two Index Cards Side-by-Side joined by Splice Tape */}
        <div className="w-full grid grid-cols-1 md:grid-cols-11 gap-6 items-center justify-center">
          
          {/* Start Person Index Card */}
          <div className="md:col-span-5 relative" ref={startRef}>
            <div className="index-card">
              
              {/* Card Header Info */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ash)]">
                  {isDirectorMode ? 'REEL A • STARTING DIRECTOR' : 'REEL A • STARTING ACTOR'}
                </span>
                {startPerson ? (
                  <span className="text-[10px] font-mono bg-[var(--grease)] text-[var(--chalk)] px-2 py-0.5 font-bold uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> READY
                  </span>
                ) : (
                  <span className="text-[10px] font-mono bg-[var(--room)] text-[var(--ash)] px-2 py-0.5">
                    UNASSIGNED
                  </span>
                )}
              </div>

              {/* Input Row */}
              <div className="flex items-center gap-4">
                {startPerson?.profile_path ? (
                  <img
                    src={getProfileUrl(startPerson.profile_path, 'w185')}
                    alt={startPerson.name}
                    className="headshot-thumb ring-2 ring-[var(--grease)]"
                  />
                ) : (
                  <div className="headshot-fallback">{isDirectorMode ? 'D' : 'A'}</div>
                )}

                <input
                  type="text"
                  value={startQuery}
                  onChange={(e) => {
                    setStartQuery(e.target.value);
                    if (startPerson && e.target.value !== startPerson.name) {
                      setStartPerson(null);
                    }
                  }}
                  onFocus={() => startResults.length > 0 && setShowStartDropdown(true)}
                  placeholder={isDirectorMode ? 'Strict Director Search (e.g. Quentin Tarantino)' : 'Strict Actor Search (e.g. Keanu Reeves)'}
                  className="stock-input"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showStartDropdown && startResults.length > 0 && (
                <div className="autocomplete-dropdown">
                  {startResults.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => handleSelectStart(person)}
                      className="autocomplete-item"
                    >
                      {person.profile_path ? (
                        <img
                          src={getProfileUrl(person.profile_path, 'w185')}
                          alt={person.name}
                          className="headshot-thumb"
                        />
                      ) : (
                        <div className="headshot-fallback">{person.name.charAt(0)}</div>
                      )}
                      <div>
                        <div className="item-name font-mono font-bold text-sm text-[var(--room)]">
                          {person.name}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--ash)] uppercase font-bold">
                          {isDirectorMode ? '[ DIRECTING DEPARTMENT ]' : '[ ACTING DEPARTMENT ]'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Splice Connector & Swap Control */}
          <div className="md:col-span-1 flex flex-col items-center justify-center my-2 md:my-0">
            <div className="hidden md:block w-full h-[2px] border-t-2 border-dashed border-[var(--ash)] mb-2" />
            <button
              type="button"
              onClick={handleSwap}
              className="p-3 border-2 border-[var(--ash)] text-[var(--ash)] hover:text-[var(--stock)] hover:border-[var(--stock)] transition-all bg-[var(--room)] shadow-lg rounded-none"
              title="Swap start and target"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="hidden md:block w-full h-[2px] border-t-2 border-dashed border-[var(--ash)] mt-2" />
          </div>

          {/* End Person Index Card */}
          <div className="md:col-span-5 relative" ref={endRef}>
            <div className="index-card">
              
              {/* Card Header Info */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ash)]">
                  {isDirectorMode ? 'REEL B • TARGET DIRECTOR' : 'REEL B • TARGET ACTOR'}
                </span>
                {endPerson ? (
                  <span className="text-[10px] font-mono bg-[var(--grease)] text-[var(--chalk)] px-2 py-0.5 font-bold uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> READY
                  </span>
                ) : (
                  <span className="text-[10px] font-mono bg-[var(--room)] text-[var(--ash)] px-2 py-0.5">
                    UNASSIGNED
                  </span>
                )}
              </div>

              {/* Input Row */}
              <div className="flex items-center gap-4">
                {endPerson?.profile_path ? (
                  <img
                    src={getProfileUrl(endPerson.profile_path, 'w185')}
                    alt={endPerson.name}
                    className="headshot-thumb ring-2 ring-[var(--grease)]"
                  />
                ) : (
                  <div className="headshot-fallback">{isDirectorMode ? 'D' : 'B'}</div>
                )}

                <input
                  type="text"
                  value={endQuery}
                  onChange={(e) => {
                    setEndQuery(e.target.value);
                    if (endPerson && e.target.value !== endPerson.name) {
                      setEndPerson(null);
                    }
                  }}
                  onFocus={() => endResults.length > 0 && setShowEndDropdown(true)}
                  placeholder={isDirectorMode ? 'Strict Director Search (e.g. Martin Scorsese)' : 'Strict Actor Search (e.g. Kevin Bacon)'}
                  className="stock-input"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showEndDropdown && endResults.length > 0 && (
                <div className="autocomplete-dropdown">
                  {endResults.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => handleSelectEnd(person)}
                      className="autocomplete-item"
                    >
                      {person.profile_path ? (
                        <img
                          src={getProfileUrl(person.profile_path, 'w185')}
                          alt={person.name}
                          className="headshot-thumb"
                        />
                      ) : (
                        <div className="headshot-fallback">{person.name.charAt(0)}</div>
                      )}
                      <div>
                        <div className="item-name font-mono font-bold text-sm text-[var(--room)]">
                          {person.name}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--ash)] uppercase font-bold">
                          {isDirectorMode ? '[ DIRECTING DEPARTMENT ]' : '[ ACTING DEPARTMENT ]'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Preset Pairs Bar (Centrally Aligned) */}
        <div className="flex flex-wrap items-center justify-center text-center gap-2.5 font-mono text-xs text-[var(--ash)] max-w-5xl px-2 w-full mx-auto">
          <span className="flex items-center justify-center gap-1.5 text-[var(--chalk)] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[var(--grease)]" /> Verified reel pairings:
          </span>
          {presets.map((pair, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(pair)}
              className="px-3 py-1.5 border border-[var(--ash)]/40 hover:border-[var(--grease)] hover:text-[var(--chalk)] hover:bg-[var(--grease)]/15 transition-all rounded-none bg-[var(--room)] shadow-sm text-[11px]"
            >
              {pair.start.name} ➔ {pair.end.name}
            </button>
          ))}
        </div>

        {/* Physical Splicer Action Button (Centrally Aligned) */}
        <div className="pt-2 flex justify-center items-center w-full mx-auto">
          <button
            type="submit"
            disabled={isLoading || !startPerson || !endPerson}
            className="splicer-btn mx-auto"
          >
            {isDirectorMode ? <Video className="w-5 h-5" /> : <Film className="w-5 h-5" />}
            <span>{isDirectorMode ? 'FIND DIRECTOR CONNECTION' : 'FIND THE CONNECTION'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

      </form>
    </div>
  );
}
