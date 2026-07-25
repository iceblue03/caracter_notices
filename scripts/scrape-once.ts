/**
 * One-shot bulk scrape: run this manually, ONCE, from an environment with
 * real internet access (a laptop, CI runner, etc.) — not part of the running
 * app. It exists because:
 *   1. Apify calls cost money, so this project never scrapes on a schedule
 *      or per-request — someone runs this by hand when they want fresh data.
 *   2. The environment this script was written in could not reach
 *      api.apify.com / x.com / bunjang.co.kr / daangn.com at all (outbound
 *      access blocked by that sandbox's network policy), so it had to be
 *      handed off to run somewhere with normal internet access instead.
 *
 * Usage:
 *   APIFY_API_TOKEN=xxx bun run scrape-once
 *   APIFY_API_TOKEN=xxx APIFY_API_TOKEN_2=yyy bun run scrape-once   # spends token 1 down, then falls back to token 2
 *
 * What it does:
 *   - Scrapes 당근마켓 · 번개장터 goods listings, then all X/Twitter accounts
 *     (goods first, since that's the newer/smaller workload — Twitter's ~49
 *     accounts are more likely to be the one that runs a token dry).
 *   - Merges results into data/feed-store.json + data/goods-store.json
 *     (dedup by id — safe to re-run any time, it only ever adds).
 *   - Mirrors both into src/sampleFeed.json + src/sampleGoods.json, the
 *     bundled fallback the client shows even with zero backend/token
 *     configured (see src/data.ts).
 *
 * Afterwards: review with `git diff`, then commit + push so Vercel picks up
 * the refreshed snapshot on the next deploy.
 */
import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { SOURCE_ACCOUNTS, scrapeTwitter, mergeFeedPosts } from '../src/server/twitter';
import { scrapeGoods, mergeGoodsListings } from '../src/server/goods';
import type { FeedPost, GoodsListing } from '../src/types';

function loadTokens(): string[] {
  if (process.env.APIFY_API_TOKENS) {
    return process.env.APIFY_API_TOKENS.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [process.env.APIFY_API_TOKEN, process.env.APIFY_API_TOKEN_2].filter(
    (t): t is string => Boolean(t),
  );
}

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function main() {
  const tokens = loadTokens();
  if (tokens.length === 0) {
    console.error(
      'No Apify token found. Set APIFY_API_TOKEN (and optionally APIFY_API_TOKEN_2) in .env,\n' +
      'or APIFY_API_TOKENS="token1,token2".',
    );
    process.exitCode = 1;
    return;
  }
  console.log(`Using ${tokens.length} Apify token(s) (sticky fallback: token 1 until it fails, then token 2, ...).`);

  const feedStorePath = path.join(process.cwd(), 'data', 'feed-store.json');
  const goodsStorePath = path.join(process.cwd(), 'data', 'goods-store.json');
  const sampleFeedPath = path.join(process.cwd(), 'src', 'sampleFeed.json');
  const sampleGoodsPath = path.join(process.cwd(), 'src', 'sampleGoods.json');

  // ── Goods (당근마켓 · 번개장터) — runs first; see file header for why. ────
  console.log('\n=== Scraping goods (당근마켓 · 번개장터) ===');
  const existingGoods = loadJson<{ listings: GoodsListing[]; ts: number }>(goodsStorePath, { listings: [], ts: 0 });
  const freshGoods = await scrapeGoods(tokens);
  const { merged: mergedGoods, addedCount: addedGoods } = mergeGoodsListings(existingGoods.listings, freshGoods);
  writeJson(goodsStorePath, { listings: mergedGoods, ts: Date.now() });
  writeJson(sampleGoodsPath, mergedGoods);
  console.log(`Goods: +${addedGoods} new listings (total ${mergedGoods.length}).`);
  console.log('Wrote data/goods-store.json + src/sampleGoods.json.');

  // ── X / Twitter ────────────────────────────────────────────────────────
  console.log(`\n=== Scraping ${SOURCE_ACCOUNTS.length} X/Twitter accounts ===`);
  const existingFeed = loadJson<{ posts: FeedPost[]; ts: number }>(feedStorePath, { posts: [], ts: 0 });
  const freshPosts = await scrapeTwitter(tokens, SOURCE_ACCOUNTS);
  const { merged: mergedPosts, addedCount: addedPosts } = mergeFeedPosts(existingFeed.posts, freshPosts);
  writeJson(feedStorePath, { posts: mergedPosts, ts: Date.now() });
  writeJson(sampleFeedPath, mergedPosts);
  console.log(`Feed: +${addedPosts} new posts (total ${mergedPosts.length}).`);
  console.log('Wrote data/feed-store.json + src/sampleFeed.json.');

  console.log('\nDone. Review with `git diff`, then commit + push so Vercel picks up the refresh.');
  if (mergedGoods.length === 0) {
    console.log(
      '\nNote: 0 goods listings came back. The Bunjang/Danggeun actor input field names in\n' +
      'src/server/goods.ts are a best-effort guess (see the comment at the top of that file) —\n' +
      'open the actor on Apify Console → Input tab and adjust buildInput()/toGoodsListing() to match.',
    );
  }
}

main().catch((error) => {
  console.error('scrape-once failed:', error);
  process.exitCode = 1;
});
