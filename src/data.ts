import { FeedPost, GoodsListing } from './types';
import snapshot from './sampleFeed.json';
import goodsSnapshot from './sampleGoods.json';

/**
 * A bundled snapshot of real scraped posts (mirrors data/feed-store.json at
 * build time), not dummy placeholder data. It exists so the app shows real
 * content immediately — including on static hosts like GitHub Pages, which
 * have no server and so can never reach /api/feed/sync. When a real backend
 * IS available, live posts merge in on top of this (deduped by id in App.tsx).
 */
export const SAMPLE_POSTS: FeedPost[] = snapshot as FeedPost[];

/**
 * Same idea as SAMPLE_POSTS, but for the Goods tab (mirrors
 * data/goods-store.json). Starts empty — populate both by running
 * `bun run scrape-once` from an environment with real internet access (see
 * scripts/scrape-once.ts and README.md), which overwrites this file with
 * whatever it actually scraped. Deliberately never filled with placeholder
 * listings: a fabricated price/link would be actively misleading here.
 */
export const SAMPLE_GOODS: GoodsListing[] = goodsSnapshot as GoodsListing[];
