import { useCallback, useEffect, useState } from 'react';

// Bumped to v2 when the taxonomy switched from anime characters to works,
// so old character-id subscriptions in storage are discarded.
const STORAGE_KEY = 'ojosama.subscriptions.v2';
const LEGACY_STORAGE_KEY = 'oshinoti.subscriptions.v2';

// Works a first-time visitor starts with, so the feed isn't empty.
// (w001 원피스 · w031 체인소맨 · w071 주술회전 — the pre-filled examples;
// 'misc' — the 기타 bucket, so unclassified live posts are visible too.)
const DEFAULT_SUBSCRIPTIONS = ['w001', 'w031', 'w071', 'misc'];

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore malformed storage */
  }
  return DEFAULT_SUBSCRIPTIONS;
}

/** Manages the set of subscribed character IDs, persisted to localStorage. */
export function useSubscriptions() {
  const [ids, setIds] = useState<string[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore quota errors */
    }
  }, [ids]);

  const isSubscribed = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const subscribe = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const unsubscribe = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const replace = useCallback((nextIds: string[]) => {
    setIds([...new Set(nextIds)]);
  }, []);

  return { ids, isSubscribed, toggle, subscribe, unsubscribe, replace };
}
