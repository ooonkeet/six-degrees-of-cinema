/**
 * Vercel Serverless API Proxy for TMDB requests.
 * Bypasses mobile carrier ISP DNS blocks, adblockers, and CORS restrictions.
 */
export default async function handler(req, res) {
  // CORS & Caching Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint, ...params } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  const apiKey = process.env.VITE_TMDB_API_KEY || '528acb56b0bcc343f10877af2195e92c';

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    ...params,
  });

  const targetUrl = `https://api.themoviedb.org/3${endpoint}?${queryParams.toString()}`;

  try {
    const tmdbRes = await fetch(targetUrl);

    if (tmdbRes.status === 401) {
      return res.status(401).json({ error: 'INVALID_API_KEY' });
    }
    if (tmdbRes.status === 429) {
      return res.status(429).json({ error: 'RATE_LIMIT' });
    }
    if (!tmdbRes.ok) {
      return res.status(tmdbRes.status).json({ error: `TMDB_API_ERROR_${tmdbRes.status}` });
    }

    const data = await tmdbRes.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Vercel TMDB Proxy Error:', err);
    return res.status(500).json({ error: 'TMDB_PROXY_FETCH_FAILED', message: err.message });
  }
}
