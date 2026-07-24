import { Character, FeedPost } from '../types';

export interface SyncResult {
  posts: FeedPost[];
  live: boolean;
  reason?: string;
}

/**
 * Ask the server to scrape the source accounts of the given characters and
 * return only the posts relevant to them. Falls back to `live: false` (no live
 * data) when the Apify token isn't configured or the request fails.
 */
export async function syncLiveFeed(characters: Character[]): Promise<SyncResult> {
  const accounts = [...new Set(characters.flatMap((c) => c.sourceAccounts))];
  const characterIds = characters.map((c) => c.id);
  if (accounts.length === 0) return { posts: [], live: false, reason: 'no-accounts' };

  try {
    const res = await fetch('/api/feed/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts, characterIds }),
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
