import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'oshinoti.subscriptions.v1';

// Characters a first-time visitor starts with, so the feed isn't empty.
const DEFAULT_SUBSCRIPTIONS = ['gojo', 'anya', 'nezuko'];

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

  return { ids, isSubscribed, toggle, subscribe, unsubscribe };
}
