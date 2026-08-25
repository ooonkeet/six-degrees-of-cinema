import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WorkbenchForm from './components/WorkbenchForm';
import LoadingSequence from './components/LoadingSequence';
import FilmStrip from './components/FilmStrip';
import ExplainerModal from './components/ExplainerModal';
import ApiKeyModal from './components/ApiKeyModal';
import { findConnectionPath, findDirectorConnectionPath } from './services/bfsEngine';
import { getApiKey } from './services/tmdb';
import { AlertCircle, Film, RefreshCw } from 'lucide-react';

export default function App() {
  const [searchMode, setSearchMode] = useState('actor'); // 'actor' | 'director'
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showExplainerModal, setShowExplainerModal] = useState(false);

  const [startPerson, setStartPerson] = useState(null);
  const [endPerson, setEndPerson] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState({ message: '', nodesVisited: 0 });

  const [pathNodes, setPathNodes] = useState(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Check API Key on mount
  useEffect(() => {
    const key = getApiKey();
    setHasApiKey(Boolean(key && key.trim().length > 0));
  }, []);

  const handleSaveApiKey = () => {
    const key = getApiKey();
    setHasApiKey(Boolean(key && key.trim().length > 0));
  };

  const handleModeChange = (mode) => {
    if (mode !== searchMode) {
      setSearchMode(mode);
      setPathNodes(null);
      setSearchAttempted(false);
      setErrorMessage(null);
    }
  };

  const handleRunSearch = async (personA, personB) => {
    setStartPerson(personA);
    setEndPerson(personB);
    setIsLoading(true);
    setPathNodes(null);
    setSearchAttempted(false);
    setErrorMessage(null);

    try {
      const searchFn = searchMode === 'director' ? findDirectorConnectionPath : findConnectionPath;

      const result = await searchFn(personA, personB, (progress) => {
        setLoadingStatus({
          message: progress.message,
          nodesVisited: progress.nodesVisited || 0,
        });
      });

      setPathNodes(result);
      setSearchAttempted(true);
    } catch (err) {
      console.error('Search error:', err);
      if (err.message === 'NO_API_KEY') {
        setShowApiKeyModal(true);
        setErrorMessage('TMDB API Key missing. Please provide a key to begin threading.');
      } else if (err.message === 'INVALID_API_KEY') {
        setShowApiKeyModal(true);
        setErrorMessage('Invalid TMDB API Key. Please update your key in settings.');
      } else if (err.message === 'RATE_LIMIT') {
        setErrorMessage('TMDB reel rate limit exceeded. Pause a moment before feeding the next film.');
      } else {
        setErrorMessage('The film strip encountered a splice error while reading credits.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--room)] aperture-animate selection:bg-[var(--grease)] selection:text-[var(--chalk)]">
      
      {/* Header with Mode Switcher */}
      <Header
        searchMode={searchMode}
        onSelectMode={handleModeChange}
        onOpenExplainer={() => setShowExplainerModal(true)}
      />

      {/* Main Centered Workbench Body */}
      <main className="flex-1 pb-20 flex flex-col items-center justify-start w-full">
        
        {/* Form Inputs & Splicer */}
        <WorkbenchForm
          searchMode={searchMode}
          onSubmit={handleRunSearch}
          isLoading={isLoading}
          hasApiKey={hasApiKey}
          onNeedApiKey={() => setShowApiKeyModal(true)}
        />

        {/* Loading State: Frame-by-Frame Film Strip Assembly */}
        {isLoading && (
          <LoadingSequence
            statusMessage={loadingStatus.message}
            nodesVisited={loadingStatus.nodesVisited}
          />
        )}

        {/* Error State Banner */}
        {errorMessage && !isLoading && (
          <div className="w-full max-w-2xl mx-auto my-8 px-4">
            <div className="p-4 border-2 border-[var(--grease)] bg-[var(--grease)]/10 text-[var(--chalk)] font-mono text-sm flex items-center justify-center text-center gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--grease)] flex-shrink-0" />
              <div>
                <span className="font-bold uppercase block text-xs text-[var(--grease)]">
                  REEL NOTICE
                </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Result View: Physical 35mm Film Strip with Alternative Takes */}
        {!isLoading && pathNodes && pathNodes.length > 0 && (
          <FilmStrip
            allTakes={pathNodes}
            startActor={startPerson}
            endActor={endPerson}
            searchMode={searchMode}
          />
        )}

        {/* In-Voice Empty / No-Path State per Spec */}
        {!isLoading && searchAttempted && (!pathNodes || pathNodes.length === 0) && !errorMessage && (
          <div className="w-full max-w-xl mx-auto my-12 px-4 text-center">
            <div className="index-card border-2 border-[var(--ash)] py-12 px-8 flex flex-col items-center">
              <Film className="w-12 h-12 text-[var(--ash)] mb-4 opacity-50" />
              <h3 className="font-display text-2xl font-bold text-[var(--room)] mb-2 uppercase tracking-wide">
                {searchMode === 'director' ? 'No Shared Director Collaborator Found' : 'No Reel Connection Found'}
              </h3>
              <p className="font-mono text-sm text-[var(--room)]/80 leading-relaxed mb-6 max-w-md">
                {searchMode === 'director'
                  ? '"No shared actor collaborator links these two directors — try a more prolific auteur pair."'
                  : '"No reel connects these two — try a shorter chain or a more prolific pair."'}
              </p>
              <button
                onClick={() => {
                  setSearchAttempted(false);
                  setPathNodes(null);
                }}
                className="splicer-btn text-xs py-2 px-6"
              >
                <RefreshCw className="w-3.5 h-3.5" /> CLEAR WORKBENCH
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      <ExplainerModal
        isOpen={showExplainerModal}
        onClose={() => setShowExplainerModal(false)}
      />

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSaveKey={handleSaveApiKey}
      />

    </div>
  );
}
