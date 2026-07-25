import { AnalyticsEvent, AnalyticsEventName, AnalyticsPropValue } from '../analyticsTypes';

// ── Identity ────────────────────────────────────────────────────────────────
// clientId: this browser, forever (localStorage). sessionId: this tab, until
// it's closed (sessionStorage) — a fresh tab/reload-after-close is a new
// session, but reloading mid-visit keeps counting as the same one.
const CLIENT_ID_KEY = 'ojosama.analytics.clientId';
const SESSION_ID_KEY = 'ojosama.analytics.sessionId';

function randomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function readOrCreate(storage: Storage, key: string): { id: string; created: boolean } {
  try {
    const existing = storage.getItem(key);
    if (existing) return { id: existing, created: false };
    const id = randomId();
    storage.setItem(key, id);
    return { id, created: true };
  } catch {
    return { id: randomId(), created: true }; // storage unavailable (private mode etc.) — degrade to a one-off id
  }
}

let clientId = '';
let sessionId = '';
let sessionIsNew = false;

function ensureIdentity() {
  if (clientId && sessionId) return;
  clientId = readOrCreate(localStorage, CLIENT_ID_KEY).id;
  const session = readOrCreate(sessionStorage, SESSION_ID_KEY);
  sessionId = session.id;
  sessionIsNew = session.created;
}

// ── Queueing + flush ────────────────────────────────────────────────────────
const ENDPOINT = '/api/analytics/events';
const FLUSH_INTERVAL_MS = 5000;
const FLUSH_AT_QUEUE_SIZE = 20;

let queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | undefined;
let serverLooksAbsent = false; // stop trying after a hard failure (static hosting, no backend)

function push(name: AnalyticsEventName, props?: Record<string, AnalyticsPropValue>) {
  ensureIdentity();
  queue.push({ name, ts: Date.now(), clientId, sessionId, props });
  if (queue.length >= FLUSH_AT_QUEUE_SIZE) flush();
}

function flush(useBeacon = false) {
  if (queue.length === 0 || serverLooksAbsent) return;
  const events = queue;
  queue = [];
  const payload = JSON.stringify({ clientId, sessionId, events });

  if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }));
    return;
  }
  fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
    .then((res) => {
      if (res.status === 404) serverLooksAbsent = true; // no backend at all — stop wasting requests
    })
    .catch(() => {
      /* best-effort telemetry — never surface a failure to the user */
    });
}

// ── View dwell-time tracking ────────────────────────────────────────────────
// "where do people get stuck" needs to know how long each screen was actually
// on screen, not just that it was opened — so every view change closes out
// the previous one with a measured duration before opening the next.
let currentView: { view: string; id?: string; enteredAt: number } | null = null;

function closeCurrentView() {
  if (!currentView) return;
  const seconds = Math.round((Date.now() - currentView.enteredAt) / 100) / 10;
  push('view_duration', { view: currentView.view, id: currentView.id, seconds });
  currentView = null;
}

export type PageViewMethod = 'initial' | 'nav' | 'chip' | 'card' | 'back_button' | 'discover_cta' | 'sidebar';

export function trackPageView(
  view: 'feed' | 'discover' | 'character' | 'stats' | 'goods',
  opts: { id?: string; name?: string; method?: PageViewMethod } = {},
) {
  closeCurrentView();
  currentView = { view, id: opts.id, enteredAt: Date.now() };
  push('page_view', { view, id: opts.id, name: opts.name, method: opts.method ?? 'nav' });
}

/** The one explicit "뒤로" affordance in the app — distinct from routine nav clicks. */
export function trackBack(from: 'feed' | 'discover' | 'character', fromId: string | undefined, to: string) {
  push('nav_back', { from, fromId, to });
}

export function trackSubscribe(action: 'subscribe' | 'unsubscribe', kind: 'work' | 'character', id: string, name: string) {
  push(action, { kind, id, name });
}

export function trackOnboardingStepView(step: number, label: string) {
  onboardingStep = step;
  push('onboarding_step_view', { step, label });
}

export function trackOnboardingStepBack(fromStep: number, toStep: number) {
  push('onboarding_step_back', { fromStep, toStep });
}

export function trackOnboardingComplete(score: number, rank: string, titleCount: number) {
  onboardingStep = undefined;
  push('onboarding_complete', { score, rank, titleCount });
}

export function trackPreference(field: string, value: string) {
  push('preference_set', { field, value });
}

export function trackMascotExpression(mood: string, replyKey?: string, step?: number) {
  push('mascot_expression', { mood, replyKey, step });
}

export function trackFeatureUse(feature: string, extra?: Record<string, AnalyticsPropValue>) {
  push('feature_use', { feature, ...extra });
}

// ── Onboarding abandonment ───────────────────────────────────────────────────
// If the tab goes away while onboarding is mid-flow (no `onboarding_complete`
// fired yet), that's a real "gave up here" signal — captured on unload rather
// than relying on the user reaching a "cancel" button that doesn't exist.
let onboardingStep: number | undefined;

// ── Rage clicks ──────────────────────────────────────────────────────────────
// 3+ clicks on the same element within a short window reads as frustration
// ("why isn't this doing anything") — a cheap, generic proxy for "stuck here"
// that doesn't require instrumenting every button by hand.
const RAGE_WINDOW_MS = 1500;
const RAGE_THRESHOLD = 3;
let lastClickTarget: EventTarget | null = null;
let lastClickAt = 0;
let clickStreak = 0;

function describeTarget(el: Element): string {
  const button = el.closest('button, a, [role="button"]') ?? el;
  const text = (button.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return text || button.tagName.toLowerCase();
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Element | null;
  if (!target) return;
  const now = Date.now();
  if (target === lastClickTarget && now - lastClickAt < RAGE_WINDOW_MS) {
    clickStreak += 1;
  } else {
    clickStreak = 1;
  }
  lastClickTarget = target;
  lastClickAt = now;
  if (clickStreak === RAGE_THRESHOLD) {
    push('rage_click', { target: describeTarget(target), view: currentView?.view, id: currentView?.id });
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
let initialized = false;

/** Call once, near app startup. Sets up flushing, unload handling, and rage-click detection. */
export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  ensureIdentity();
  if (sessionIsNew) {
    push('session_start', {
      referrer: document.referrer || undefined,
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  flushTimer = setInterval(() => flush(), FLUSH_INTERVAL_MS);
  document.addEventListener('click', onDocumentClick, true);

  const flushFinal = () => {
    if (onboardingStep !== undefined) {
      push('onboarding_abandon', { step: onboardingStep });
    }
    closeCurrentView();
    flush(true);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushFinal();
  });
  window.addEventListener('pagehide', flushFinal);
}
