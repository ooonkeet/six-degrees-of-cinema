/**
 * TMDB API Service supporting Actor & Director Combined Credits, Serverless Proxy & Session Caching
 */

export const DEFAULT_TMDB_API_KEY = "528acb56b0bcc343f10877af2195e92c";

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// In-Memory Session Caches
const personSearchCache = new Map();
const personCreditsCache = new Map();
const directorCreditsCache = new Map();
const mediaCreditsCache = new Map();
const mediaKeywordsCache = new Map();
const personDetailsCache = new Map();

export function getApiKey() {
  const customKey = localStorage.getItem('six_degrees_tmdb_key');
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }
  return import.meta.env.VITE_TMDB_API_KEY || DEFAULT_TMDB_API_KEY || '';
}

export function setCustomApiKey(key) {
  if (key) {
    localStorage.setItem('six_degrees_tmdb_key', key.trim());
  } else {
    localStorage.removeItem('six_degrees_tmdb_key');
  }
}

export function getProfileUrl(path, size = 'w185') {
  if (!path) return null;
  return `${IMAGE_BASE_URL}${size}${path}`;
}

export function getPosterUrl(path, size = 'w342') {
  if (!path) return null;
  return `${IMAGE_BASE_URL}${size}${path}`;
}

async function tmdbFetch(endpoint, params = {}) {
  const apiKey = getApiKey();

  // Route through Vercel Serverless Proxy in production to bypass mobile carrier ISP blocks & CORS
  const isProduction = import.meta.env.PROD || window.location.hostname.includes('vercel.app');

  if (isProduction) {
    try {
      const queryParams = new URLSearchParams({
        endpoint,
        ...params,
      });
      const proxyUrl = `/api/tmdb?${queryParams.toString()}`;
      const response = await fetch(proxyUrl);

      if (response.status === 401) {
        throw new Error('INVALID_API_KEY');
      }
      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      }
      if (response.ok) {
        return response.json();
      }
    } catch (err) {
      if (err.message === 'INVALID_API_KEY' || err.message === 'RATE_LIMIT') {
        throw err;
      }
      console.warn('Vercel API proxy failed, falling back to direct fetch:', err);
    }
  }

  // Direct fetch fallback (for local development)
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    ...params,
  });

  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url);

  if (response.status === 401) {
    throw new Error('INVALID_API_KEY');
  }
  if (response.status === 429) {
    throw new Error('RATE_LIMIT');
  }
  if (!response.ok) {
    throw new Error(`API_ERROR_${response.status}`);
  }

  return response.json();
}

/**
 * Search person by query for autocomplete with STRICT department filtering
 * Mode: 'actor' | 'director'
 */
export async function searchPerson(query, mode = 'actor') {
  if (!query || query.trim().length < 2) return [];
  const cacheKey = `${mode}_${query.trim().toLowerCase()}`;

  if (personSearchCache.has(cacheKey)) {
    return personSearchCache.get(cacheKey);
  }

  try {
    const data = await tmdbFetch('/search/person', { query: query.trim(), include_adult: 'false' });
    let results = data.results || [];

    if (mode === 'director') {
      results = results.filter((p) => {
        if (p.known_for_department === 'Directing') return true;
        if (p.known_for && p.known_for.some(k => k.job === 'Director' || k.department === 'Directing')) return true;
        const famousAuteurs = ['clint eastwood', 'woody allen', 'mel gibson', 'ben affleck', 'jon favreau', 'taika waititi', 'jordan peele', 'orson welles', 'charlie chaplin', 'greta gerwig', 'brad bird', 'george clooney', 'john krasinski'];
        if (famousAuteurs.includes(p.name?.toLowerCase())) return true;
        return false;
      });
    } else {
      results = results.filter((p) => {
        if (p.known_for_department === 'Acting') return true;
        if (p.known_for && p.known_for.some(k => k.media_type === 'movie' || k.media_type === 'tv')) return true;
        return false;
      });
    }

    results = results.slice(0, 16);
    personSearchCache.set(cacheKey, results);
    return results;
  } catch (err) {
    console.error('TMDB person search error:', err);
    throw err;
  }
}

/**
 * Get person detailed bio and record metadata
 */
export async function getPersonDetails(personId) {
  if (personDetailsCache.has(personId)) {
    return personDetailsCache.get(personId);
  }

  try {
    const data = await tmdbFetch(`/person/${personId}`);
    personDetailsCache.set(personId, data);
    return data;
  } catch (err) {
    console.error(`TMDB person details error for ${personId}:`, err);
    return null;
  }
}

/**
 * Get person combined acting credits (Movies + TV Shows)
 */
export async function getPersonCredits(personId) {
  if (personCreditsCache.has(personId)) {
    return personCreditsCache.get(personId);
  }

  try {
    const data = await tmdbFetch(`/person/${personId}/combined_credits`);

    const cast = (data.cast || [])
      .filter((m) => m.id && (m.title || m.name))
      .map((m) => ({
        id: m.id,
        media_type: m.media_type || (m.first_air_date ? 'tv' : 'movie'),
        title: m.title || m.name,
        poster_path: m.poster_path,
        release_date: m.release_date || m.first_air_date || '',
        vote_count: m.vote_count || 0,
        popularity: m.popularity || 0,
        episode_count: m.episode_count || null,
        character: m.character || '',
      }))
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

    personCreditsCache.set(personId, cast);
    return cast;
  } catch (err) {
    console.error(`TMDB combined credits error for person ${personId}:`, err);
    throw err;
  }
}

/**
 * Get director credits (Movies + TV Shows directed by this person)
 */
export async function getDirectorCredits(personId) {
  if (directorCreditsCache.has(personId)) {
    return directorCreditsCache.get(personId);
  }

  try {
    const data = await tmdbFetch(`/person/${personId}/combined_credits`);

    const directed = (data.crew || [])
      .filter((m) => m.id && (m.title || m.name) && (m.job === 'Director' || m.department === 'Directing'))
      .map((m) => ({
        id: m.id,
        media_type: m.media_type || (m.first_air_date ? 'tv' : 'movie'),
        title: m.title || m.name,
        poster_path: m.poster_path,
        release_date: m.release_date || m.first_air_date || '',
        vote_count: m.vote_count || 0,
        popularity: m.popularity || 0,
        job: m.job || 'Director',
      }))
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

    directorCreditsCache.set(personId, directed);
    return directed;
  } catch (err) {
    console.error(`TMDB director credits error for person ${personId}:`, err);
    throw err;
  }
}

/**
 * Get cast credits for a movie or TV show (Expanded top 300 billed actors)
 */
export async function getMediaCredits(mediaId, mediaType = 'movie') {
  const cacheKey = `${mediaType}_${mediaId}`;
  if (mediaCreditsCache.has(cacheKey)) {
    return mediaCreditsCache.get(cacheKey);
  }

  try {
    const endpoint = mediaType === 'tv' ? `/tv/${mediaId}/credits` : `/movie/${mediaId}/credits`;
    const data = await tmdbFetch(endpoint);

    const cast = (data.cast || [])
      .filter((a) => a.id && a.name)
      .slice(0, 300);

    mediaCreditsCache.set(cacheKey, cast);
    return cast;
  } catch (err) {
    console.error(`TMDB cast error for ${mediaType} ${mediaId}:`, err);
    throw err;
  }
}

/**
 * Fetch live TMDB keywords for award tag detection
 */
export async function getMediaKeywords(mediaId, mediaType = 'movie') {
  const cacheKey = `${mediaType}_${mediaId}`;
  if (mediaKeywordsCache.has(cacheKey)) {
    return mediaKeywordsCache.get(cacheKey);
  }

  try {
    const endpoint = mediaType === 'tv' ? `/tv/${mediaId}/keywords` : `/movie/${mediaId}/keywords`;
    const data = await tmdbFetch(endpoint);
    const rawKeywords = data.keywords || data.results || [];
    const keywords = rawKeywords.map((k) => k.name.toLowerCase());

    mediaKeywordsCache.set(cacheKey, keywords);
    return keywords;
  } catch (err) {
    console.error(`TMDB keywords error for ${mediaType} ${mediaId}:`, err);
    return [];
  }
}
