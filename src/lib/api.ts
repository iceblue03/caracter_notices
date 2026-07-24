import { Character, FeedPost } from '../types';

export interface SyncResult {
  posts: FeedPost[];
  live: boolean;
  reason?: string;
}

/**
 * Ask the server for posts relevant to the given characters from its shared,
 * cost-guarded cache.
 *
 * `force` distinguishes the two call sites:
 *   • `false` (auto-load on mount) — the server never scrapes; it returns cached
 *     live posts if any exist, otherwise `live: false` and the client keeps its
 *     sample feed. This costs nothing, so it's safe on every page load.
 *   • `true` (the "새 소식" button) — the server may run a real scrape, but only
 *     if its cache is stale and none is already running.
 */
export async function syncLiveFeed(
  characters: Character[],
  force = false,
): Promise<SyncResult> {
  const characterIds = characters.map((c) => c.id);
  if (characterIds.length === 0) return { posts: [], live: false, reason: 'no-accounts' };

  try {
    const res = await fetch('/api/feed/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterIds, force }),
    });
    const data = await res.json();
    if (!res.ok) return { posts: [], live: false, reason: data.error || 'request-failed' };
    return { posts: data.posts ?? [], live: data.live ?? false, reason: data.reason };
  } catch (err: any) {
    return { posts: [], live: false, reason: err?.message || 'network-error' };
  }
}

export interface SummaryResult {
  available: boolean;
  summary: string | null;
  error?: string;
}

/** Optional AI one-line summary of a post (uses server-side Gemini if configured). */
export async function summarizePost(
  content: string,
  characterName: string,
): Promise<SummaryResult> {
  try {
    const res = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, character: characterName }),
    });
    return await res.json();
  } catch (err: any) {
    return { available: false, summary: null, error: err?.message };
  }
}
