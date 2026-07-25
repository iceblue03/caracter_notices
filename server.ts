import "dotenv/config";
import express from "express";
import path from "path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { CHARACTERS } from "./src/characters";
import { annotatePost, annotateGoods } from "./src/lib/matching";
import { scrapeTwitter, mergeFeedPosts } from "./src/server/twitter";
import { scrapeGoods, mergeGoodsListings } from "./src/server/goods";
import { translateText } from "./src/server/translate";
import { fetchProxiedImage } from "./src/server/imageProxy";
import type { FeedPost, GoodsListing } from "./src/types";

// A manual "refresh" can trigger a new scrape at most this often (env-tunable).
const FORCE_MIN_MS = process.env.SCRAPE_FORCE_MIN_MS != null
  ? Number(process.env.SCRAPE_FORCE_MIN_MS)
  : 60 * 1000;

// ── Persistent, cost-safe feed store ──────────────────────────────────────
// Scraping via Apify costs money, so scraped posts are saved to disk and
// re-used forever. A scrape only ADDS tweets we haven't seen (dedup by id) —
// so "pull once" holds and the same tweet is never fetched/stored twice.
// A manual refresh may scrape at most once per FORCE_MIN_MS; concurrent
// requests join the single in-flight scrape instead of launching their own.
const FEED_STORE_PATH = path.join(process.cwd(), "data", "feed-store.json");
const GOODS_STORE_PATH = path.join(process.cwd(), "data", "goods-store.json");

let feedCache: { posts: FeedPost[]; ts: number } | null = null;
let feedInflight: Promise<FeedPost[]> | null = null;
let goodsCache: { listings: GoodsListing[]; ts: number } | null = null;
let goodsInflight: Promise<GoodsListing[]> | null = null;

function loadJsonStore<T>(storePath: string, key: string): { data: T[]; ts: number } | null {
  try {
    const parsed = JSON.parse(readFileSync(storePath, "utf8"));
    if (Array.isArray(parsed?.[key])) {
      return { data: parsed[key] as T[], ts: Number(parsed.ts) || 0 };
    }
  } catch {
    /* no store yet — first run */
  }
  return null;
}

function saveJsonStore(storePath: string, key: string, data: unknown[], ts: number): void {
  try {
    mkdirSync(path.dirname(storePath), { recursive: true });
    writeFileSync(storePath, JSON.stringify({ [key]: data, ts }, null, 2));
  } catch (error) {
    console.error(`[store] save failed (${storePath}):`, error);
  }
}

function loadStores(): void {
  const feed = loadJsonStore<FeedPost>(FEED_STORE_PATH, "posts");
  if (feed) {
    feedCache = { posts: feed.data, ts: feed.ts };
    console.log(`[store] loaded ${feed.data.length} saved posts from disk`);
  }
  const goods = loadJsonStore<GoodsListing>(GOODS_STORE_PATH, "listings");
  if (goods) {
    goodsCache = { listings: goods.data, ts: goods.ts };
    console.log(`[store] loaded ${goods.data.length} saved goods listings from disk`);
  }
}

/** Scrape, then merge NEW tweets into the persistent store (dedup by id). */
async function scrapeAndStoreFeed(token: string): Promise<FeedPost[]> {
  const fresh = await scrapeTwitter(token);
  const { merged, addedCount } = mergeFeedPosts(feedCache?.posts ?? [], fresh);
  feedCache = { posts: merged, ts: Date.now() };
  saveJsonStore(FEED_STORE_PATH, "posts", merged, feedCache.ts);
  console.log(`[scrape] +${addedCount} new tweets (total stored: ${merged.length})`);
  return merged;
}

/** Scrape, then merge NEW goods listings into the persistent store (dedup by id). */
async function scrapeAndStoreGoods(token: string): Promise<GoodsListing[]> {
  const fresh = await scrapeGoods(token);
  const { merged, addedCount } = mergeGoodsListings(goodsCache?.listings ?? [], fresh);
  goodsCache = { listings: merged, ts: Date.now() };
  saveJsonStore(GOODS_STORE_PATH, "listings", merged, goodsCache.ts);
  console.log(`[scrape] +${addedCount} new goods listings (total stored: ${merged.length})`);
  return merged;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Load any previously scraped posts so restarts reuse them (no re-scrape).
  loadStores();

  app.use(cors());
  app.use(express.json());

  // ── Image proxy ────────────────────────────────────────────────────────
  // Instagram CDN images block hot-linking; proxy them so the browser can load
  // them with an Instagram referer.
  app.get("/api/image-proxy", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).send("URL is required");
    }
    try {
      const result = await fetchProxiedImage(url);
      if (!result.ok) {
        return res.status(result.status).send(result.statusText);
      }
      res.setHeader('Content-Type', result.contentType!);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(result.buffer);
    } catch (error) {
      console.error("[image-proxy] Error:", error);
      res.status(500).send("Failed to fetch image");
    }
  });

  // ── Live feed (every stored post, fully classified) ─────────────────────
  // Always returns the ENTIRE persistent store, each post annotated against the
  // full work catalog (see MISC_ID fallback in matching.ts) — nothing is ever
  // filtered out of the response, so no scraped post is silently dropped.
  // Which posts actually show in a given user's feed is a client-side concern
  // (filtered by their subscriptions); the API's job is just "classify everything".
  // Scraping itself is cost-guarded (see FORCE_MIN_MS above):
  //   • auto-load (force !== true) NEVER scrapes — it returns the cache, or an
  //     "idle" signal if nothing has been scraped yet.
  //   • a manual refresh (force === true) may trigger a new scrape, but only if
  //     the cache is older than FORCE_MIN_MS and none is already in flight.
  // Result: no matter how many people open or refresh the shared link, Apify
  // runs at most once every few minutes.
  app.post("/api/feed/sync", async (req, res) => {
    const token = process.env.APIFY_API_TOKEN;
    const { force } = req.body as { force?: boolean };

    const respond = (posts: FeedPost[]): FeedPost[] =>
      posts
        .map((post) => annotatePost(post, CHARACTERS))
        .sort((a, b) => b.timestamp - a.timestamp);

    // No token → not an error; the client keeps its sample feed.
    if (!token) {
      return res.json({ posts: [], live: false, reason: "no-token" });
    }

    const now = Date.now();
    const cacheAge = feedCache ? now - feedCache.ts : Infinity;

    // Auto-load path: never spend money. Serve cache if we have one.
    if (force !== true) {
      if (feedCache) {
        return res.json({ posts: respond(feedCache.posts), live: true, cached: true });
      }
      return res.json({ posts: [], live: false, reason: "idle" });
    }

    // Manual refresh path.
    try {
      // A scrape is already running → join it instead of launching another.
      if (feedInflight) {
        const raw = await feedInflight;
        return res.json({ posts: respond(raw), live: true, cached: true });
      }
      // Cache still fresh enough → don't scrape again yet.
      if (feedCache && cacheAge < FORCE_MIN_MS) {
        return res.json({ posts: respond(feedCache.posts), live: true, cached: true });
      }
      // Otherwise, launch a single scrape that everyone shares. It merges any
      // new tweets into the persistent store (dedup by id) and updates feedCache.
      feedInflight = scrapeAndStoreFeed(token).finally(() => {
        feedInflight = null;
      });
      const raw = await feedInflight;
      const posts = respond(raw);
      const classified = posts.filter((p) => p.matches!.some((m) => m.characterId !== "misc")).length;
      console.log(`Classified ${classified}/${posts.length} posts to a specific work (rest → 기타)`);
      return res.json({ posts, live: true });
    } catch (error: any) {
      console.error("Apify API error:", error);
      // Fall back to stale cache if we have one, so a failed refresh still shows data.
      if (feedCache) {
        return res.json({ posts: respond(feedCache.posts), live: true, stale: true });
      }
      return res.status(502).json({
        posts: [],
        live: false,
        error: error.message || "Failed to fetch from Apify",
      });
    }
  });

  // ── Goods sync (당근마켓 · 번개장터, via Apify) ─────────────────────────
  // Same shape/cost-guard contract as /api/feed/sync above, just for
  // marketplace listings instead of tweets. See src/server/goods.ts for the
  // scraping details (and its caveats — the selectors there are unverified).
  app.post("/api/goods/sync", async (req, res) => {
    const token = process.env.APIFY_API_TOKEN;
    const { force } = req.body as { force?: boolean };

    const respond = (listings: GoodsListing[]): GoodsListing[] =>
      listings
        .map((listing) => annotateGoods(listing, CHARACTERS))
        .sort((a, b) => b.timestamp - a.timestamp);

    if (!token) {
      return res.json({ listings: [], live: false, reason: "no-token" });
    }

    const now = Date.now();
    const cacheAge = goodsCache ? now - goodsCache.ts : Infinity;

    if (force !== true) {
      if (goodsCache) {
        return res.json({ listings: respond(goodsCache.listings), live: true, cached: true });
      }
      return res.json({ listings: [], live: false, reason: "idle" });
    }

    try {
      if (goodsInflight) {
        const raw = await goodsInflight;
        return res.json({ listings: respond(raw), live: true, cached: true });
      }
      if (goodsCache && cacheAge < FORCE_MIN_MS) {
        return res.json({ listings: respond(goodsCache.listings), live: true, cached: true });
      }
      goodsInflight = scrapeAndStoreGoods(token).finally(() => {
        goodsInflight = null;
      });
      const raw = await goodsInflight;
      return res.json({ listings: respond(raw), live: true });
    } catch (error: any) {
      console.error("Apify goods scrape error:", error);
      if (goodsCache) {
        return res.json({ listings: respond(goodsCache.listings), live: true, stale: true });
      }
      return res.status(502).json({
        listings: [],
        live: false,
        error: error.message || "Failed to fetch goods from Apify",
      });
    }
  });

  // ── Post translation ────────────────────────────────────────────────────
  // Uses Google's free, unofficial "gtx" translate endpoint (the same one
  // browser extensions use) — no API key or billing account needed. It's
  // unsupported/undocumented, so treat failures as routine and degrade
  // gracefully rather than surfacing them as errors.
  app.post("/api/translate", async (req, res) => {
    const { text, target } = req.body as { text?: string; target?: string };
    if (!text) {
      return res.status(400).json({ translated: null, error: "text required" });
    }
    const result = await translateText(text, target || "ko");
    res.json(result);
  });

  // ── Vite / static hosting ──────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
