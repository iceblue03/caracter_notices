import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CHARACTERS } from '../../src/characters';
import { annotatePost } from '../../src/lib/matching';
import { scrapeTwitter, mergeFeedPosts } from '../../src/server/twitter';
import { readTmpJson, writeTmpJson } from '../../src/server/serverlessStore';
import type { FeedPost } from '../../src/types';
// Static import (not fs.readFileSync) so Vercel's build bundles this JSON
// with the function — the committed cache is the durable baseline; /tmp
// below only overlays same-instance scrapes on top of it.
import feedSeed from '../../data/feed-store.json';

const TMP_PATH = '/tmp/ojosama-feed-store.json';
const FORCE_MIN_MS = process.env.SCRAPE_FORCE_MIN_MS != null
  ? Number(process.env.SCRAPE_FORCE_MIN_MS)
  : 60 * 1000;

interface Store {
  posts: FeedPost[];
  ts: number;
}

/**
 * /tmp only survives within one warm lambda instance, so this only avoids
 * re-scraping on back-to-back requests hitting the same instance — it is
 * NOT durable across cold starts or redeploys. To actually grow the
 * permanent dataset, run a scrape from `bun run dev` (normal filesystem,
 * no serverless limits) and commit the updated data/feed-store.json.
 */
function loadStore(): Store {
  const tmp = readTmpJson<Store>(TMP_PATH);
  if (tmp && Array.isArray(tmp.posts)) return tmp;
  const seed = feedSeed as { posts?: FeedPost[]; ts?: number };
  return { posts: Array.isArray(seed.posts) ? seed.posts : [], ts: seed.ts ?? 0 };
}

// See server.ts's /api/feed/sync for the full behavior contract this mirrors:
// auto-load (force !== true) never scrapes; a manual refresh may scrape, but
// only if the cache is stale enough (FORCE_MIN_MS) — Apify calls cost money.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ posts: [], live: false, error: 'method not allowed' });
    return;
  }

  const token = process.env.APIFY_API_TOKEN;
  const { force } = (req.body ?? {}) as { force?: boolean };

  const respond = (posts: FeedPost[]) =>
    posts.map((post) => annotatePost(post, CHARACTERS)).sort((a, b) => b.timestamp - a.timestamp);

  if (!token) {
    res.status(200).json({ posts: [], live: false, reason: 'no-token' });
    return;
  }

  const store = loadStore();

  if (force !== true) {
    if (store.posts.length > 0) {
      res.status(200).json({ posts: respond(store.posts), live: true, cached: true });
      return;
    }
    res.status(200).json({ posts: [], live: false, reason: 'idle' });
    return;
  }

  const cacheAge = Date.now() - store.ts;
  if (store.posts.length > 0 && cacheAge < FORCE_MIN_MS) {
    res.status(200).json({ posts: respond(store.posts), live: true, cached: true });
    return;
  }

  try {
    const fresh = await scrapeTwitter(token);
    const { merged, addedCount } = mergeFeedPosts(store.posts, fresh);
    writeTmpJson(TMP_PATH, { posts: merged, ts: Date.now() });
    console.log(`[feed/sync] +${addedCount} new tweets (total this instance: ${merged.length})`);
    res.status(200).json({ posts: respond(merged), live: true });
  } catch (error: any) {
    console.error('Apify API error:', error);
    if (store.posts.length > 0) {
      res.status(200).json({ posts: respond(store.posts), live: true, stale: true });
      return;
    }
    res.status(502).json({ posts: [], live: false, error: error.message || 'Failed to fetch from Apify' });
  }
}
