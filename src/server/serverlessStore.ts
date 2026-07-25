import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Best-effort persistence for Vercel serverless functions: only /tmp is
 * writable there, and it's only guaranteed to survive within a single warm
 * instance — not across cold starts, redeploys, or other concurrent
 * instances/regions. That's fine for "don't re-scrape twice in a row on a
 * warm lambda"; real durability across deploys comes from the committed seed
 * JSON under data/, which this overlays on top of.
 */
export function readTmpJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

export function writeTmpJson(path: string, data: unknown): void {
  try {
    writeFileSync(path, JSON.stringify(data));
  } catch (error) {
    console.error(`[store] tmp write failed (${path}):`, error);
  }
}
