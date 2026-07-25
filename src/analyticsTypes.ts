/**
 * Shared event schema for the user-testing analytics pipeline (client tracker
 * in `lib/analytics.ts`, server ingestion/aggregation in `server.ts` +
 * `lib/analyticsSummary.ts`). Kept as loose, flat `props` bags rather than a
 * variant type per event — this is telemetry for watching real test sessions,
 * not a type-checked domain model, and new event shapes shouldn't require
 * touching a union everywhere.
 */
export type AnalyticsEventName =
  | 'session_start'
  | 'page_view'
  | 'view_duration'
  | 'nav_back'
  | 'subscribe'
  | 'unsubscribe'
  | 'onboarding_step_view'
  | 'onboarding_step_back'
  | 'onboarding_complete'
  | 'onboarding_abandon'
  | 'preference_set'
  | 'mascot_expression'
  | 'feature_use'
  | 'rage_click';

export type AnalyticsPropValue = string | number | boolean | undefined;

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  /** Epoch ms, set by the client at the moment the event happened (not on flush). */
  ts: number;
  clientId: string;
  sessionId: string;
  props?: Record<string, AnalyticsPropValue>;
}

export interface AnalyticsIngestPayload {
  clientId: string;
  sessionId: string;
  events: AnalyticsEvent[];
}

/** The 5 onboarding stages in `TasteLanding`, by index — shared so the funnel labels line up. */
export const ONBOARDING_STEP_LABELS = ['프로필', '세계관', '오시 조건', '작품 선택', '완료'];
