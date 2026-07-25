export type Platform = 'instagram' | 'twitter';

/** Secondhand-goods marketplaces the Goods tab pulls listings from. */
export type GoodsPlatform = 'danggeun' | 'bunjang';

/**
 * A representative character of a work. `aliases` are the matching terms
 * (Korean/English/Japanese names & nicknames). Kept small — 2-3 per work.
 */
export interface WorkCharacter {
  name: string;       // Korean display name
  aliases: string[];  // terms that, if found in a post, tie it to this character
}

/**
 * A work (anime / manga / game) — the classifier's top-level unit. Users
 * subscribe to works; a post is relevant to a work if its text mentions the
 * work's `aliases` or any representative character's aliases/name.
 *
 * `aliases` and `characters` are filled in later (a sub-model handles that);
 * `id`, `title`, and `category` are fixed and must not be reordered/renamed.
 */
export interface Work {
  id: string;         // stable slug, e.g. "w001"
  title: string;      // canonical label as provided, e.g. "원피스"
  category: string;   // "애니메이션" | "게임"
  aliases: string[];  // work-level matching terms (may be empty until filled)
  characters: WorkCharacter[]; // 2-3 representative characters (may be empty)
}

/**
 * A subscribable anime character. Users pick these, and the feed is filtered
 * down to SNS posts that mention the character (via `keywords` / `hashtags`).
 *
 * Two kinds share this shape so every existing component (Discover, feed,
 * detail) can render either one unchanged:
 *  - `kind: 'work'` — a whole work (series-level subscription). `id` is the
 *    work's own id.
 *  - `kind: 'character'` — one representative character within a work
 *    (character-level subscription). `workId` points back to the parent
 *    `kind: 'work'` entry. Subscribing to the work already implies every
 *    character in it (the work's `keywords` include all its characters'
 *    terms); subscribing to just a character narrows the feed to that one.
 */
export interface Character {
  id: string;
  name: string;        // Korean display name  e.g. "고죠 사토루"
  nameEn: string;      // e.g. "Gojo Satoru"
  series: string;      // Korean work title this entry belongs to — its own
                        // title for `kind: 'work'`, its parent's for `kind: 'character'`
  seriesEn: string;    // English counterpart of `series`
  /** Broad content category ("애니메이션" | "게임" | "기타 콘텐츠" | "기타"). */
  category: string;
  categoryEn: string;
  kind: 'work' | 'character';
  /** For `kind: 'character'`, the id of the parent `kind: 'work'` entry. */
  workId?: string;
  role: string;        // short descriptor e.g. "특급 주술사"
  emoji: string;       // shown on the avatar
  color: string;       // accent hex, used for chips / theming
  gradient: [string, string]; // avatar background gradient
  /** Real artwork for the card/detail banner, when available (falls back to the gradient). */
  backgroundImage?: string;
  /** Profile image (avatar) for the work, when available. */
  avatarImage?: string;
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

/**
 * A secondhand-goods listing pulled from a marketplace (당근마켓 / 번개장터).
 * Mirrors FeedPost's shape closely (id/link/timestamp/matches/source) so both
 * can be sorted, filtered, and character-matched the same way.
 */
export interface GoodsListing {
  id: string;
  platform: GoodsPlatform;
  title: string;
  /** Price in KRW, when it parsed as a plain number. */
  price: number | null;
  /** Raw price text for listings that don't have a plain number (나눔, 가격제안, etc). */
  priceLabel?: string;
  description?: string;
  imageUrl?: string;
  /** Neighborhood/city the listing was posted from, when the source page exposed one. */
  location?: string;
  /** Epoch ms; best-effort (marketplace listing pages usually only show relative time). */
  timestamp: number;
  link: string;
  source: 'sample' | 'live';
  /** Characters this listing is about. Filled in by the matching layer. */
  matches?: PostMatch[];
}
