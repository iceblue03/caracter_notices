import type { FeedPost, Platform } from '../types';
import { TokenRotator } from './apifyTokens';

// ── Source accounts (X / Twitter) ─────────────────────────────────────────
// A fixed, global set of goods/event/brand accounts to scrape. One populate
// covers everyone, so results are shared regardless of who is subscribed.
// Override with SCRAPE_ACCOUNTS="handle1,handle2" (handy for cheap testing).
const CORE_ACCOUNTS = [
  'genso_journey', 'otakumanmulsang', 'THorch_KR', 'Axez18', 'gundam_info',
  'BandaiNamcoKR', 'BNKRmall', 'comicw', 'illustar_fes', 'ProjMoonStudio',
  'hamazi__', 'animateonlineKR', 'Pokemon', 'PokemonGoApp', 'pokemonkrmkt',
  'AmiAmi_Korean', 'megabox_plusm', 'dokidokigoods2',
];

// Publisher / event / game accounts requested to broaden the "전체" feed
// (games, official Korean distributors, arcade/rhythm-game brands, anime TV
// blocks, and a couple of community/webtoon platforms).
const BRAND_ACCOUNTS = [
  'NintendoAmerica', 'Nintendo_Korea', 'sega_korea', 'SEGA', 'PlayStation',
  'GoodSmile_KR', 'furyu_hm', 'GhibliML', 'TOHOanimation', 'kyoani',
  'YostarPictures', 'TOEI_PR', 'Trickcal_Re', 'SOUNDVOLTEX573',
  'maimai_official', 'BemaniProLeague', 'IIDX_OFFICIAL', 'OfficialPlayx4',
  'AGF_Korea', 'ANIPLUSTV', 'ANIPLUS_SHOP', 'Konami', 'sonic_hedgehog',
  'animalcrossing', 'UnderTale', 'laftelstore', 'Laftel_net',
  'dwci_duckcomic', 'haksan_romance', 'kdspr3', 'EternalReturnKR',
];

const DEFAULT_ACCOUNTS = [...new Set([...CORE_ACCOUNTS, ...BRAND_ACCOUNTS])];

export const SOURCE_ACCOUNTS = (process.env.SCRAPE_ACCOUNTS
  ? process.env.SCRAPE_ACCOUNTS.split(',').map((s) => s.trim()).filter(Boolean)
  : DEFAULT_ACCOUNTS);

// Which Apify X/Twitter actor to use, and how many tweets per account. Both are
// env-overridable so you can swap actors or raise the count on a paid plan
// without code changes. apidojo/tweet-scraper (suggested as an alternative)
// was tried and confirmed via a real run to reject ALL API/SDK calls on the
// free Apify plan ("subscribe to a paid plan..."), so the default stays on
// parseforge/x-com-scraper, which the existing seed data proves works there.
// If you're on a paid Apify plan, override with APIFY_TWITTER_ACTOR to try
// apidojo/tweet-scraper or another actor instead.
const TWITTER_ACTOR = process.env.APIFY_TWITTER_ACTOR || 'parseforge/x-com-scraper';
const PER_ACCOUNT = Number(process.env.SCRAPE_PER_ACCOUNT) || 10;

/** Best-effort extraction of a tweet's first image across possible shapes. */
function extractImage(t: any): string | undefined {
  const candidates = [
    t?.extendedEntities?.media?.[0]?.media_url_https,
    t?.entities?.media?.[0]?.media_url_https,
    t?.media?.[0]?.media_url_https,
    t?.media?.[0]?.url,
    Array.isArray(t?.mediaUrls) ? t.mediaUrls[0] : undefined,
    Array.isArray(t?.photos) ? (t.photos[0]?.url ?? t.photos[0]) : undefined,
  ];
  return candidates.find((u) => typeof u === 'string' && u.startsWith('http'));
}

/** Parse a timestamp that may be ISO string, epoch ms, or epoch seconds. */
function parseTimestamp(v: any): number {
  if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (!isNaN(n)) return n < 1e12 ? n * 1000 : n;
    const t = new Date(v).getTime();
    if (!isNaN(t)) return t;
  }
  return Date.now();
}

/** Convert one raw actor item into a FeedPost, or null if it isn't a tweet. */
function toFeedPost(t: any): FeedPost | null {
  if (!t || t.type === 'mock_tweet' || t.noResults || t.error) return null;
  const id = String(t.id ?? t.id_str ?? t.tweetId ?? t.rest_id ?? '');
  if (!id) return null;
  const author = t.author ?? t.user ?? {};
  const userName =
    author.userName ?? author.screen_name ?? author.username ?? t.username ?? 'unknown';
  return {
    id,
    author: author.name || author.displayName || userName,
    platform: 'twitter' as Platform,
    handle: `@${userName}`,
    avatarUrl:
      author.profilePicture ||
      author.profile_image_url_https ||
      author.profileImageUrl ||
      `https://api.dicebear.com/7.x/shapes/svg?seed=${userName}`,
    content: t.text ?? t.full_text ?? t.fullText ?? t.content ?? '',
    imageUrl: extractImage(t),
    timestamp: parseTimestamp(t.createdAt ?? t.created_at ?? t.timestamp ?? t.date),
    link: t.tweetUrl || t.url || t.twitterUrl || `https://x.com/${userName}/status/${id}`,
    source: 'live' as const,
  };
}

/**
 * Scrape each source account via a configurable Apify actor. One run per
 * account, because the free plan caps a run at ~10 items — looping is how we
 * cover every account. A single account's failure doesn't abort the rest.
 * `token` can be one string or several — pass several (e.g. two free-credit
 * accounts) to spend the first down before automatically moving to the next
 * (see TokenRotator); the live server routes only ever pass one.
 *
 * NOTE: with 49 accounts (as of this writing) this loop makes 49 sequential
 * Apify actor calls — comfortably fine from a long-running Node process
 * (`bun run dev`, a self-hosted server, or scripts/scrape-once.ts), but
 * likely too slow for a single Vercel serverless invocation. See
 * api/feed/sync.ts for how the serverless path handles that.
 */
export async function scrapeTwitter(
  token: string | string[],
  accounts: string[] = SOURCE_ACCOUNTS,
): Promise<FeedPost[]> {
  const rotator = new TokenRotator(token);
  console.log(`Scraping ${accounts.length} handles via "${TWITTER_ACTOR}" (${PER_ACCOUNT}/account)`);
  const posts: FeedPost[] = [];
  for (const handle of accounts) {
    try {
      const items = await rotator.run(async (client) => {
        const run = await client.actor(TWITTER_ACTOR).call({
          usernames: [handle],
          twitterHandles: [handle],
          handles: [handle],
          searchTerms: [`from:${handle}`],
          maxItems: PER_ACCOUNT,
          maxTweets: PER_ACCOUNT,
          sort: 'Latest',
        });
        return (await client.dataset(run.defaultDatasetId).listItems()).items;
      });
      let n = 0;
      for (const t of items as any[]) {
        const p = toFeedPost(t);
        if (p) {
          posts.push(p);
          n += 1;
        }
      }
      console.log(`  @${handle}: ${n} tweets`);
    } catch (error: any) {
      console.error(`  @${handle}: failed — ${error?.message || error}`);
    }
  }
  return posts;
}

/** Merge freshly-scraped posts into an existing list, deduped by id, newest-first. */
export function mergeFeedPosts(existing: FeedPost[], fresh: FeedPost[]): { merged: FeedPost[]; addedCount: number } {
  const seen = new Set(existing.map((p) => p.id));
  const added = fresh.filter((p) => !seen.has(p.id));
  const merged = [...added, ...existing].sort((a, b) => b.timestamp - a.timestamp);
  return { merged, addedCount: added.length };
}
