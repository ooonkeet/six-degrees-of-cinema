import { getPersonCredits, getDirectorCredits, getMediaCredits } from './tmdb';

/**
 * Helper to generate a unique string signature for a path sequence
 */
function getPathSignature(pathNodes) {
  return pathNodes.map((n) => `${n.type}_${n.id}`).join('➔');
}

/**
 * Actor-to-Actor Pathfinding Engine with Parallel Batched Promise.all Fetching:
 * Finds up to 20 UNIQUE alternative shortest path takes with blazing fast speed.
 */
export async function findConnectionPath(startActor, endActor, onProgress = () => {}) {
  if (!startActor || !endActor) return null;

  if (startActor.id === endActor.id) {
    return [
      [
        {
          type: 'actor',
          id: startActor.id,
          name: startActor.name,
          profile_path: startActor.profile_path,
        },
      ],
    ];
  }

  onProgress({ phase: 'threading', message: 'Scanning deep global filmographies & TV archives in parallel...', nodesVisited: 0 });

  const actorMap = new Map();
  actorMap.set(startActor.id, startActor);
  actorMap.set(endActor.id, endActor);

  const mediaMap = new Map();
  const alternatePaths = [];
  const seenSignatures = new Set();
  const seenMediaIds = new Set();

  // Step 1: Parallel Direct Intersection Check across ALL Movies & TV Shows
  try {
    const [startCredits, endCredits] = await Promise.all([
      getPersonCredits(startActor.id),
      getPersonCredits(endActor.id),
    ]);

    startCredits.forEach((m) => mediaMap.set(`${m.media_type}_${m.id}`, m));
    endCredits.forEach((m) => mediaMap.set(`${m.media_type}_${m.id}`, m));

    const endMediaSet = new Map();
    endCredits.forEach((m) => endMediaSet.set(`${m.media_type}_${m.id}`, m));

    const sharedMedia = startCredits.filter((m) => endMediaSet.has(`${m.media_type}_${m.id}`));

    if (sharedMedia.length > 0) {
      sharedMedia.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

      for (const sharedItem of sharedMedia) {
        const mediaKey = `${sharedItem.media_type}_${sharedItem.id}`;
        if (seenMediaIds.has(mediaKey)) continue;
        seenMediaIds.add(mediaKey);

        const path = [
          { type: 'actor', ...startActor },
          {
            type: 'movie',
            id: sharedItem.id,
            title: sharedItem.title,
            poster_path: sharedItem.poster_path,
            release_date: sharedItem.release_date,
            media_type: sharedItem.media_type,
            episode_count: sharedItem.episode_count,
            character: sharedItem.character,
          },
          { type: 'actor', ...endActor },
        ];

        const sig = getPathSignature(path);
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          alternatePaths.push(path);
        }

        if (alternatePaths.length >= 20) break;
      }

      if (alternatePaths.length > 0) {
        onProgress({
          phase: 'found',
          message: `Found ${alternatePaths.length} unique direct connection reel take(s)!`,
          nodesVisited: 2,
        });

        return alternatePaths;
      }
    }
  } catch (err) {
    console.warn('Direct connection check failed, proceeding to parallel BFS graph search', err);
  }

  // Step 2: Ultra-Fast Parallel Multi-Path Bidirectional BFS
  onProgress({ phase: 'expanding', message: 'Expanding deep co-star graph across global film & TV reels in parallel...', nodesVisited: 2 });

  const startVisited = new Map();
  startVisited.set(startActor.id, { prevActorId: null, mediaKey: null });

  const endVisited = new Map();
  endVisited.set(endActor.id, { nextActorId: null, mediaKey: null });

  let startQueue = [startActor.id];
  let endQueue = [endActor.id];

  const intersectionActorIds = new Set();
  let depth = 0;
  const maxDepth = 10;
  let totalProcessed = 0;
  const maxProcessedLimit = 1000;

  while (
    startQueue.length > 0 &&
    endQueue.length > 0 &&
    depth < maxDepth &&
    totalProcessed < maxProcessedLimit &&
    intersectionActorIds.size < 20
  ) {
    depth++;

    const expandFromStart = startQueue.length <= endQueue.length;

    if (expandFromStart) {
      const currentId = startQueue.shift();
      totalProcessed++;

      onProgress({
        phase: 'expanding',
        message: `Inspecting parallel film & TV records for ${actorMap.get(currentId)?.name || 'Actor'}...`,
        nodesVisited: totalProcessed,
      });

      try {
        const credits = await getPersonCredits(currentId);
        const candidateCredits = credits.slice(0, 150);

        // PARALLEL BATCHED FETCHING across all candidate credits
        const castResults = await Promise.all(
          candidateCredits.map((item) => getMediaCredits(item.id, item.media_type).catch(() => []))
        );

        for (let i = 0; i < candidateCredits.length; i++) {
          const item = candidateCredits[i];
          const coStars = castResults[i] || [];
          const mediaKey = `${item.media_type}_${item.id}`;

          if (!mediaMap.has(mediaKey)) {
            mediaMap.set(mediaKey, item);
          }

          for (const star of coStars) {
            if (!actorMap.has(star.id)) {
              actorMap.set(star.id, {
                id: star.id,
                name: star.name,
                profile_path: star.profile_path,
              });
            }

            if (!startVisited.has(star.id)) {
              startVisited.set(star.id, { prevActorId: currentId, mediaKey });
              startQueue.push(star.id);
            }

            if (endVisited.has(star.id)) {
              intersectionActorIds.add(star.id);
              if (intersectionActorIds.size >= 20) break;
            }
          }

          if (intersectionActorIds.size >= 20) break;
        }
      } catch (err) {
        console.warn(`Skipping actor ${currentId} due to API error`, err);
      }
    } else {
      const currentId = endQueue.shift();
      totalProcessed++;

      onProgress({
        phase: 'expanding',
        message: `Inspecting parallel film & TV records for ${actorMap.get(currentId)?.name || 'Actor'}...`,
        nodesVisited: totalProcessed,
      });

      try {
        const credits = await getPersonCredits(currentId);
        const candidateCredits = credits.slice(0, 150);

        // PARALLEL BATCHED FETCHING across all candidate credits
        const castResults = await Promise.all(
          candidateCredits.map((item) => getMediaCredits(item.id, item.media_type).catch(() => []))
        );

        for (let i = 0; i < candidateCredits.length; i++) {
          const item = candidateCredits[i];
          const coStars = castResults[i] || [];
          const mediaKey = `${item.media_type}_${item.id}`;

          if (!mediaMap.has(mediaKey)) {
            mediaMap.set(mediaKey, item);
          }

          for (const star of coStars) {
            if (!actorMap.has(star.id)) {
              actorMap.set(star.id, {
                id: star.id,
                name: star.name,
                profile_path: star.profile_path,
              });
            }

            if (!endVisited.has(star.id)) {
              endVisited.set(star.id, { nextActorId: currentId, mediaKey });
              endQueue.push(star.id);
            }

            if (startVisited.has(star.id)) {
              intersectionActorIds.add(star.id);
              if (intersectionActorIds.size >= 20) break;
            }
          }

          if (intersectionActorIds.size >= 20) break;
        }
      } catch (err) {
        console.warn(`Skipping actor ${currentId} due to API error`, err);
      }
    }
  }

  if (intersectionActorIds.size === 0) {
    return null;
  }

  for (const intersectionId of Array.from(intersectionActorIds)) {
    const startPath = [];
    let curr = intersectionId;

    while (curr !== null) {
      const info = startVisited.get(curr);
      startPath.unshift({
        actor: actorMap.get(curr),
        movie: info?.mediaKey ? mediaMap.get(info.mediaKey) : null,
      });
      curr = info ? info.prevActorId : null;
    }

    const endPath = [];
    curr = intersectionId;
    let nextInfo = endVisited.get(curr);

    while (nextInfo && nextInfo.nextActorId !== null) {
      const nextActorId = nextInfo.nextActorId;
      const mediaKey = nextInfo.mediaKey;
      endPath.push({
        movie: mediaMap.get(mediaKey),
        actor: actorMap.get(nextActorId),
      });
      curr = nextActorId;
      nextInfo = endVisited.get(curr);
    }

    const fullPathSequence = [];
    if (startPath.length > 0 && startPath[0].actor) {
      fullPathSequence.push({ type: 'actor', ...startPath[0].actor });

      for (let i = 0; i < startPath.length - 1; i++) {
        const nextHop = startPath[i + 1];
        if (nextHop.movie) {
          fullPathSequence.push({ type: 'movie', ...nextHop.movie });
        }
        if (nextHop.actor) {
          fullPathSequence.push({ type: 'actor', ...nextHop.actor });
        }
      }

      for (let i = 0; i < endPath.length; i++) {
        if (endPath[i].movie) {
          fullPathSequence.push({ type: 'movie', ...endPath[i].movie });
        }
        if (endPath[i].actor) {
          fullPathSequence.push({ type: 'actor', ...endPath[i].actor });
        }
      }

      const sig = getPathSignature(fullPathSequence);
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        alternatePaths.push(fullPathSequence);
      }
    }
  }

  return alternatePaths.length > 0 ? alternatePaths : null;
}

/**
 * Director-to-Director Pathfinding Engine with Parallel Promise.all Fetching:
 * Downloads all 200 directed movie cast lists simultaneously for instant 20 take resolution.
 */
export async function findDirectorConnectionPath(startDirector, endDirector, onProgress = () => {}) {
  if (!startDirector || !endDirector) return null;

  if (startDirector.id === endDirector.id) {
    return [
      [
        {
          type: 'director',
          id: startDirector.id,
          name: startDirector.name,
          profile_path: startDirector.profile_path,
        },
      ],
    ];
  }

  onProgress({ phase: 'threading', message: 'Scanning deep director filmographies in parallel across 200+ productions...', nodesVisited: 0 });

  const actorMap = new Map();
  const mediaMap = new Map();
  const alternatePaths = [];
  const seenSignatures = new Set();
  const seenActorIds = new Set();

  try {
    const [startDirected, endDirected] = await Promise.all([
      getDirectorCredits(startDirector.id),
      getDirectorCredits(endDirector.id),
    ]);

    const startFilms = startDirected.slice(0, 200);
    const endFilms = endDirected.slice(0, 200);

    onProgress({ phase: 'expanding', message: 'Intersecting cast lists in parallel across all director productions...', nodesVisited: startFilms.length + endFilms.length });

    // Step 1: PARALLEL BATCHED FETCHING for all 200 films from both directors
    const startCastResults = await Promise.all(
      startFilms.map((m) => getMediaCredits(m.id, m.media_type).catch(() => []))
    );

    const startActorMap = new Map();

    startFilms.forEach((movie, idx) => {
      const cast = startCastResults[idx] || [];
      for (const actor of cast) {
        actorMap.set(actor.id, actor);
        if (!startActorMap.has(actor.id)) {
          startActorMap.set(actor.id, { actor, movie });
        }
      }
    });

    const endCastResults = await Promise.all(
      endFilms.map((m) => getMediaCredits(m.id, m.media_type).catch(() => []))
    );

    endFilms.forEach((movie, idx) => {
      const cast = endCastResults[idx] || [];

      for (const actor of cast) {
        actorMap.set(actor.id, actor);

        if (startActorMap.has(actor.id) && !seenActorIds.has(actor.id)) {
          seenActorIds.add(actor.id);
          const startMatch = startActorMap.get(actor.id);

          const pathSequence = [
            { type: 'director', ...startDirector },
            {
              type: 'movie',
              id: startMatch.movie.id,
              title: startMatch.movie.title,
              poster_path: startMatch.movie.poster_path,
              release_date: startMatch.movie.release_date,
              media_type: startMatch.movie.media_type,
            },
            { type: 'actor', ...startMatch.actor, isSharedActor: true },
            {
              type: 'movie',
              id: movie.id,
              title: movie.title,
              poster_path: movie.poster_path,
              release_date: movie.release_date,
              media_type: movie.media_type,
            },
            { type: 'director', ...endDirector },
          ];

          const sig = getPathSignature(pathSequence);
          if (!seenSignatures.has(sig)) {
            seenSignatures.add(sig);
            alternatePaths.push(pathSequence);
          }

          if (alternatePaths.length >= 20) return;
        }
      }
    });

    if (alternatePaths.length > 0) {
      onProgress({
        phase: 'found',
        message: `Found ${alternatePaths.length} direct director collaborator reel take(s)!`,
        nodesVisited: alternatePaths.length * 2,
      });

      return alternatePaths;
    }

    // Step 2: Deep Multi-Actor Sequence BFS (Parallel N-hop up to 20 takes)
    onProgress({ phase: 'expanding', message: 'Expanding deep N-hop multi-actor co-star network between directors in parallel...', nodesVisited: 300 });

    const endActorMap = new Map();

    endFilms.forEach((movie, idx) => {
      const cast = endCastResults[idx] || [];
      for (const actor of cast) {
        actorMap.set(actor.id, actor);
        if (!endActorMap.has(actor.id)) {
          endActorMap.set(actor.id, { actor, movie });
        }
      }
    });

    const startVisited = new Map();
    const endVisited = new Map();

    let startQueue = [];
    let endQueue = [];

    for (const [actorId, info] of startActorMap.entries()) {
      startVisited.set(actorId, { prevActorId: null, mediaKey: null, startFilm: info.movie });
      startQueue.push(actorId);
    }

    for (const [actorId, info] of endActorMap.entries()) {
      endVisited.set(actorId, { nextActorId: null, mediaKey: null, endFilm: info.movie });
      endQueue.push(actorId);
    }

    const intersectionActorIds = new Set();
    let depth = 0;
    const maxDepth = 8;
    let totalProcessed = 0;
    const maxProcessedLimit = 800;

    while (
      startQueue.length > 0 &&
      endQueue.length > 0 &&
      depth < maxDepth &&
      totalProcessed < maxProcessedLimit &&
      intersectionActorIds.size < 20
    ) {
      depth++;

      const expandFromStart = startQueue.length <= endQueue.length;

      if (expandFromStart) {
        const currentId = startQueue.shift();
        totalProcessed++;

        try {
          const credits = await getPersonCredits(currentId);
          const candidateCredits = credits.slice(0, 150);

          const castResults = await Promise.all(
            candidateCredits.map((item) => getMediaCredits(item.id, item.media_type).catch(() => []))
          );

          for (let i = 0; i < candidateCredits.length; i++) {
            const item = candidateCredits[i];
            const coStars = castResults[i] || [];
            const mediaKey = `${item.media_type}_${item.id}`;

            if (!mediaMap.has(mediaKey)) {
              mediaMap.set(mediaKey, item);
            }

            for (const star of coStars) {
              if (!actorMap.has(star.id)) {
                actorMap.set(star.id, star);
              }

              if (!startVisited.has(star.id)) {
                const parentInfo = startVisited.get(currentId);
                startVisited.set(star.id, {
                  prevActorId: currentId,
                  mediaKey,
                  startFilm: parentInfo?.startFilm,
                });
                startQueue.push(star.id);
              }

              if (endVisited.has(star.id)) {
                intersectionActorIds.add(star.id);
                if (intersectionActorIds.size >= 20) break;
              }
            }

            if (intersectionActorIds.size >= 20) break;
          }
        } catch (e) {}
      } else {
        const currentId = endQueue.shift();
        totalProcessed++;

        try {
          const credits = await getPersonCredits(currentId);
          const candidateCredits = credits.slice(0, 150);

          const castResults = await Promise.all(
            candidateCredits.map((item) => getMediaCredits(item.id, item.media_type).catch(() => []))
          );

          for (let i = 0; i < candidateCredits.length; i++) {
            const item = candidateCredits[i];
            const coStars = castResults[i] || [];
            const mediaKey = `${item.media_type}_${item.id}`;

            if (!mediaMap.has(mediaKey)) {
              mediaMap.set(mediaKey, item);
            }

            for (const star of coStars) {
              if (!actorMap.has(star.id)) {
                actorMap.set(star.id, star);
              }

              if (!endVisited.has(star.id)) {
                const parentInfo = endVisited.get(currentId);
                endVisited.set(star.id, {
                  nextActorId: currentId,
                  mediaKey,
                  endFilm: parentInfo?.endFilm,
                });
                endQueue.push(star.id);
              }

              if (startVisited.has(star.id)) {
                intersectionActorIds.add(star.id);
                if (intersectionActorIds.size >= 20) break;
              }
            }

            if (intersectionActorIds.size >= 20) break;
          }
        } catch (e) {}
      }
    }

    for (const interId of Array.from(intersectionActorIds)) {
      const startPath = [];
      let curr = interId;

      while (curr !== null) {
        const info = startVisited.get(curr);
        startPath.unshift({
          actor: actorMap.get(curr),
          movie: info?.mediaKey ? mediaMap.get(info.mediaKey) : null,
          startFilm: info?.startFilm,
        });
        curr = info ? info.prevActorId : null;
      }

      const endPath = [];
      curr = interId;
      let nextInfo = endVisited.get(curr);

      while (nextInfo && nextInfo.nextActorId !== null) {
        const nextActorId = nextInfo.nextActorId;
        const mediaKey = nextInfo.mediaKey;
        endPath.push({
          movie: mediaMap.get(mediaKey),
          actor: actorMap.get(nextActorId),
          endFilm: nextInfo?.endFilm,
        });
        curr = nextActorId;
        nextInfo = endVisited.get(curr);
      }

      const fullSeq = [];
      fullSeq.push({ type: 'director', ...startDirector });

      const firstStartFilm = startPath[0]?.startFilm || startPath[0]?.movie;
      if (firstStartFilm) {
        fullSeq.push({
          type: 'movie',
          id: firstStartFilm.id,
          title: firstStartFilm.title,
          poster_path: firstStartFilm.poster_path,
          release_date: firstStartFilm.release_date,
          media_type: firstStartFilm.media_type,
        });
      }

      for (let i = 0; i < startPath.length; i++) {
        fullSeq.push({ type: 'actor', ...startPath[i].actor });
        if (i < startPath.length - 1 && startPath[i + 1].movie) {
          fullSeq.push({ type: 'movie', ...startPath[i + 1].movie });
        }
      }

      for (let i = 0; i < endPath.length; i++) {
        if (endPath[i].movie) {
          fullSeq.push({ type: 'movie', ...endPath[i].movie });
        }
        fullSeq.push({ type: 'actor', ...endPath[i].actor });
      }

      const lastEndFilm = endVisited.get(interId)?.endFilm || endPath[endPath.length - 1]?.endFilm;
      if (lastEndFilm) {
        fullSeq.push({
          type: 'movie',
          id: lastEndFilm.id,
          title: lastEndFilm.title,
          poster_path: lastEndFilm.poster_path,
          release_date: lastEndFilm.release_date,
          media_type: lastEndFilm.media_type,
        });
      }

      fullSeq.push({ type: 'director', ...endDirector });

      const sig = getPathSignature(fullSeq);
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        alternatePaths.push(fullSeq);
      }
    }

    if (alternatePaths.length > 0) {
      onProgress({
        phase: 'found',
        message: `Found ${alternatePaths.length} multi-actor director sequence take(s)!`,
        nodesVisited: alternatePaths.length * 4,
      });

      return alternatePaths;
    }
  } catch (err) {
    console.error('Director pathfinding error:', err);
  }

  return null;
}
