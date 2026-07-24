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
 * `force` distinguishes two behaviors:
 *   • `false` (auto-load on mount — the only call site now that syncing is
 *     stopped) — the server never scrapes; it returns cached live posts if
 *     any exist, otherwise `live: false` and the client keeps its sample feed.
 *   • `true` — the server may run a real scrape, but only if its cache is
 *     stale and none is already running. No longer triggered anywhere in the
 *     UI, but kept so the server contract still supports it.
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

export interface TranslateResult {
  translated: string | null;
  error?: string;
}

/** Translate a post's content to Korean (free Google Translate endpoint, no API key). */
export async function translatePost(content: string, target = 'ko'): Promise<TranslateResult> {
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content, target }),
    });
    return await res.json();
  } catch (err: any) {
    return { translated: null, error: err?.message };
  }
}
