import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CHARACTERS } from '../../src/characters';
import { annotateGoods } from '../../src/lib/matching';
import { scrapeGoods, mergeGoodsListings } from '../../src/server/goods';
import { readTmpJson, writeTmpJson } from '../../src/server/serverlessStore';
import type { GoodsListing } from '../../src/types';
import goodsSeed from '../../data/goods-store.json';

const TMP_PATH = '/tmp/ojosama-goods-store.json';
const FORCE_MIN_MS = process.env.SCRAPE_FORCE_MIN_MS != null
  ? Number(process.env.SCRAPE_FORCE_MIN_MS)
  : 60 * 1000;

interface Store {
  listings: GoodsListing[];
  ts: number;
}

function loadStore(): Store {
  const tmp = readTmpJson<Store>(TMP_PATH);
  if (tmp && Array.isArray(tmp.listings)) return tmp;
  const seed = goodsSeed as { listings?: GoodsListing[]; ts?: number };
  return { listings: Array.isArray(seed.listings) ? seed.listings : [], ts: seed.ts ?? 0 };
}

// Same shape/contract as api/feed/sync.ts, see there for the full rationale.
// Goods starts with an EMPTY committed seed (no real listings were scraped
// yet — this sandbox couldn't reach bunjang.co.kr/daangn.com/apify.com to
// pull any), so the Goods tab stays empty until someone with real network
// access (production, or `bun run dev` locally) triggers a `force: true` sync.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ listings: [], live: false, error: 'method not allowed' });
    return;
  }

  const token = process.env.APIFY_API_TOKEN;
  const { force } = (req.body ?? {}) as { force?: boolean };

  const respond = (listings: GoodsListing[]) =>
    listings.map((listing) => annotateGoods(listing, CHARACTERS)).sort((a, b) => b.timestamp - a.timestamp);

  if (!token) {
    res.status(200).json({ listings: [], live: false, reason: 'no-token' });
    return;
  }

  const store = loadStore();

  if (force !== true) {
    if (store.listings.length > 0) {
      res.status(200).json({ listings: respond(store.listings), live: true, cached: true });
      return;
    }
    res.status(200).json({ listings: [], live: false, reason: 'idle' });
    return;
  }

  const cacheAge = Date.now() - store.ts;
  if (store.listings.length > 0 && cacheAge < FORCE_MIN_MS) {
    res.status(200).json({ listings: respond(store.listings), live: true, cached: true });
    return;
  }

  try {
    const fresh = await scrapeGoods(token);
    const { merged, addedCount } = mergeGoodsListings(store.listings, fresh);
    writeTmpJson(TMP_PATH, { listings: merged, ts: Date.now() });
    console.log(`[goods/sync] +${addedCount} new listings (total this instance: ${merged.length})`);
    res.status(200).json({ listings: respond(merged), live: true });
  } catch (error: any) {
    console.error('Apify goods scrape error:', error);
    if (store.listings.length > 0) {
      res.status(200).json({ listings: respond(store.listings), live: true, stale: true });
      return;
    }
    res.status(502).json({ listings: [], live: false, error: error.message || 'Failed to fetch goods from Apify' });
  }
}
