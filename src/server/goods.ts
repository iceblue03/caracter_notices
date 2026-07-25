import type { ApifyClient } from 'apify-client';
import type { GoodsListing, GoodsPlatform } from '../types';
import { CHARACTERS } from '../characters';
import { TokenRotator } from './apifyTokens';

// ── IMPORTANT: unverified against the live actors ─────────────────────────
// These two actor IDs were found and confirmed by the project owner directly
// on Apify Store — this dev environment has no outbound access to
// api.apify.com, so their exact Input/Output schema couldn't be inspected
// here. The input payload below sends several plausible field-name aliases
// for the same value (Apify actors generally ignore fields they don't
// recognize, so this is a safe hedge, not a real "we support all of these").
// If a sync comes back with 0 items for a platform, open that actor's page
// on Apify Console → Input tab, and trim buildInput()/toGoodsListing() down
// to the field names it actually documents.
const BUNJANG_ACTOR = process.env.APIFY_BUNJANG_ACTOR || 'oxygenated_quagmire/bunjang-market-scraper';
const DANGGEUN_ACTOR = process.env.APIFY_DANGGEUN_ACTOR || 'oxygenated_quagmire/daangn-market-scraper';

// ── Search keywords ────────────────────────────────────────────────────────
// Both marketplaces are searched by keyword rather than by fixed accounts, so
// the default keyword list is derived from the character catalog itself: the
// N most popular works + "굿즈", which keeps results on-topic without hand
// curation. Override entirely with GOODS_KEYWORDS="키워드1,키워드2".
function topCharacterKeywords(n: number): string[] {
  return [...CHARACTERS]
    .filter((c) => c.id !== 'misc')
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, n)
    .map((c) => `${c.name} 굿즈`);
}

const BUNJANG_TOP_N = Number(process.env.BUNJANG_SEARCH_TOP_N) || 20;
const DANGGEUN_TOP_N = Number(process.env.DANGGEUN_SEARCH_TOP_N) || 10;

const GOODS_KEYWORDS_OVERRIDE = process.env.GOODS_KEYWORDS
  ? process.env.GOODS_KEYWORDS.split(',').map((s) => s.trim()).filter(Boolean)
  : null;

const BUNJANG_KEYWORDS = GOODS_KEYWORDS_OVERRIDE ?? topCharacterKeywords(BUNJANG_TOP_N);
const DANGGEUN_KEYWORDS = GOODS_KEYWORDS_OVERRIDE ?? topCharacterKeywords(DANGGEUN_TOP_N);

// 당근마켓 listings are neighborhood-scoped. Default is a single, populous
// guess (human-readable, since a purpose-built actor likely wants a plain
// district name rather than a URL slug) — override with DANGGEUN_REGIONS.
const DEFAULT_DANGGEUN_REGIONS = ['서울 강남구'];
const DANGGEUN_REGIONS = (process.env.DANGGEUN_REGIONS
  ? process.env.DANGGEUN_REGIONS.split(',').map((s) => s.trim()).filter(Boolean)
  : DEFAULT_DANGGEUN_REGIONS);

// One actor call covers ALL keywords for a platform (assuming the actor
// accepts a list) rather than one call per keyword — much cheaper in Apify
// compute/credit than looping. If the actor turns out to only read the first
// keyword, per-keyword coverage degrades but the run still costs one call.
const MAX_ITEMS_PER_KEYWORD = Number(process.env.GOODS_PER_QUERY) || 20;

function pick(raw: any, keys: string[]): any {
  for (const k of keys) {
    if (raw?.[k] != null && raw[k] !== '') return raw[k];
  }
  return undefined;
}

function firstImage(raw: any): string | undefined {
  const candidates = [
    raw?.productImage,
    raw?.imageUrl,
    raw?.image,
    raw?.thumbnail,
    raw?.thumbnailUrl,
    Array.isArray(raw?.images) ? raw.images[0] : undefined,
    Array.isArray(raw?.productImages) ? raw.productImages[0] : undefined,
    Array.isArray(raw?.imageUrls) ? raw.imageUrls[0] : undefined,
  ];
  return candidates.find((u) => typeof u === 'string' && u.startsWith('http'));
}

function parsePrice(raw: any): number | null {
  const v = pick(raw, ['price', 'productPrice', 'cost', 'amount']);
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const digits = String(v).replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/** Best-effort: marketplace cards usually show relative Korean time ("3일 전"), not an absolute date. */
function parseRelativeKoreanTimestamp(text: string): number | undefined {
  const now = Date.now();
  const m = text.match(/(방금)|(\d+)\s*(분|시간|일|주|개월|년)\s*전/);
  if (!m) return undefined;
  if (m[1]) return now;
  const n = Number(m[2]);
  const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000;
  switch (m[3]) {
    case '분': return now - n * MIN;
    case '시간': return now - n * HOUR;
    case '일': return now - n * DAY;
    case '주': return now - n * 7 * DAY;
    case '개월': return now - n * 30 * DAY;
    case '년': return now - n * 365 * DAY;
    default: return undefined;
  }
}

function parseListingTimestamp(v: any): number {
  if (v == null) return Date.now();
  if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
  const s = String(v);
  const rel = parseRelativeKoreanTimestamp(s);
  if (rel != null) return rel;
  const t = new Date(s).getTime();
  return isNaN(t) ? Date.now() : t;
}

function toGoodsListing(raw: any, platform: GoodsPlatform): GoodsListing | null {
  const title = pick(raw, ['title', 'name', 'productName', 'itemName']);
  const idPart = pick(raw, ['pid', 'id', 'productId', 'itemId']);
  const rawLink = pick(raw, ['url', 'link', 'productUrl', 'itemUrl']);
  const link = rawLink || (platform === 'bunjang' && idPart ? `https://m.bunjang.co.kr/products/${idPart}` : undefined);
  if (!title || !link) return null;

  const price = parsePrice(raw);
  const priceLabel = price == null ? pick(raw, ['price', 'priceText']) : undefined;
  const location = pick(raw, ['location', 'region', 'address', 'neighborhood']);
  const timeText = pick(raw, ['updateTime', 'time', 'date', 'createdAt', 'updatedAt']);

  return {
    id: `${platform}:${idPart ?? link}`,
    platform,
    title: String(title).trim(),
    price,
    priceLabel: priceLabel != null ? String(priceLabel) : undefined,
    description: pick(raw, ['description', 'desc', 'content']) || undefined,
    imageUrl: firstImage(raw),
    location: location ? String(location) : undefined,
    timestamp: parseListingTimestamp(timeText),
    link: String(link),
    source: 'live',
  };
}

async function scrapePlatform(
  token: string | string[],
  actorId: string,
  platform: GoodsPlatform,
  keywords: string[],
  extraInput: Record<string, unknown> = {},
): Promise<GoodsListing[]> {
  if (keywords.length === 0) return [];
  const rotator = new TokenRotator(token);
  try {
    const maxItems = MAX_ITEMS_PER_KEYWORD * keywords.length;
    const items = await rotator.run(async (client: ApifyClient) => {
      const run = await client.actor(actorId).call({
        search: keywords,
        searchQueries: keywords,
        keywords,
        query: keywords[0],
        keyword: keywords[0],
        maxItems,
        maxResults: maxItems,
        limit: maxItems,
        ...extraInput,
      });
      return (await client.dataset(run.defaultDatasetId).listItems()).items;
    });
    const listings: GoodsListing[] = [];
    for (const raw of items as any[]) {
      const listing = toGoodsListing(raw, platform);
      if (listing) listings.push(listing);
    }
    console.log(`  [${platform}] ${items.length} raw items → ${listings.length} parsed`);
    return listings;
  } catch (error: any) {
    console.error(`  [${platform}] actor "${actorId}" failed — ${error?.message || error}`);
    return [];
  }
}

/** Scrape only 번개장터 (Bunjang) — exported separately so the one-shot script can split token/keyword usage per platform. */
export async function scrapeBunjang(token: string | string[], keywords: string[] = BUNJANG_KEYWORDS): Promise<GoodsListing[]> {
  return scrapePlatform(token, BUNJANG_ACTOR, 'bunjang', keywords);
}

/** Scrape only 당근마켓 (Danggeun Market) — see scrapeBunjang. */
export async function scrapeDanggeun(token: string | string[], keywords: string[] = DANGGEUN_KEYWORDS): Promise<GoodsListing[]> {
  return scrapePlatform(token, DANGGEUN_ACTOR, 'danggeun', keywords, {
    region: DANGGEUN_REGIONS,
    regions: DANGGEUN_REGIONS,
    location: DANGGEUN_REGIONS[0],
  });
}

/**
 * Scrape both marketplaces via their dedicated Apify actors — one call per
 * platform (all keywords passed together), not one call per keyword, to
 * keep Apify credit usage low. A failure on one platform doesn't block the
 * other (Promise.all + per-call try/catch, see scrapePlatform).
 */
export async function scrapeGoods(token: string | string[]): Promise<GoodsListing[]> {
  console.log(
    `Scraping goods: ${BUNJANG_KEYWORDS.length} Bunjang keywords via "${BUNJANG_ACTOR}", ` +
    `${DANGGEUN_KEYWORDS.length} Danggeun keywords via "${DANGGEUN_ACTOR}" (region: ${DANGGEUN_REGIONS.join(', ')})`,
  );
  const [bunjang, danggeun] = await Promise.all([scrapeBunjang(token), scrapeDanggeun(token)]);
  return [...bunjang, ...danggeun];
}

/** Merge freshly-scraped listings into an existing list, deduped by id, newest-first. */
export function mergeGoodsListings(
  existing: GoodsListing[],
  fresh: GoodsListing[],
): { merged: GoodsListing[]; addedCount: number } {
  const seen = new Set(existing.map((g) => g.id));
  const added = fresh.filter((g) => !seen.has(g.id));
  const merged = [...added, ...existing].sort((a, b) => b.timestamp - a.timestamp);
  return { merged, addedCount: added.length };
}
