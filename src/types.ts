export type Platform = 'instagram' | 'twitter';

/**
 * A subscribable anime character. Users pick these, and the feed is filtered
 * down to SNS posts that mention the character (via `keywords` / `hashtags`).
 */
export interface Character {
  id: string;
  name: string;        // Korean display name  e.g. "고죠 사토루"
  nameEn: string;      // e.g. "Gojo Satoru"
  series: string;      // Korean series title  e.g. "주술회전"
  seriesEn: string;    // e.g. "Jujutsu Kaisen"
  role: string;        // short descriptor e.g. "특급 주술사"
  emoji: string;       // shown on the avatar
  color: string;       // accent hex, used for chips / theming
  gradient: [string, string]; // avatar background gradient
  /** Popularity hint used for "인기 캐릭터" ordering (higher = more popular). */
  popularity: number;
  tagline: string;     // one-line flavour text
  /** Terms that, if found in a post, mark it as relevant to this character. */
  keywords: string[];
  /** Hashtag-style terms (no leading '#'), also used for matching. */
  hashtags: string[];
  /** SNS handles that frequently post about this character (used for live sync). */
  sourceAccounts: string[];
}

/** Which character a post matched, and why. */
export interface PostMatch {
  characterId: string;
  score: number;   // number of distinct matched terms
  terms: string[]; // the terms that matched (for "왜 떴을까?")
}

export interface FeedPost {
  id: string;
  author: string;      // account display name
  platform: Platform;
  handle: string;      // "@handle"
  avatarUrl: string;
  content: string;
  imageUrl?: string;
  /** Epoch ms; used for sorting and relative-time formatting. */
  timestamp: number;
  link: string;
  /** Where the post came from: bundled sample data vs. a live Apify sync. */
  source: 'sample' | 'live';
  /** Characters this post is about. Filled in by the matching layer. */
  matches?: PostMatch[];
}
