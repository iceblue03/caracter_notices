import { FeedPost } from './types';
import snapshot from './sampleFeed.json';

/**
 * A bundled snapshot of real scraped posts (mirrors data/feed-store.json at
 * build time), not dummy placeholder data. It exists so the app shows real
 * content immediately — including on static hosts like GitHub Pages, which
 * have no server and so can never reach /api/feed/sync. When a real backend
 * IS available, live posts merge in on top of this (deduped by id in App.tsx).
 */
export const SAMPLE_POSTS: FeedPost[] = snapshot as FeedPost[];
