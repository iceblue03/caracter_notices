import "dotenv/config";
import express from "express";
import path from "path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createServer as createViteServer } from "vite";
import { ApifyClient } from "apify-client";
import cors from "cors";
import { CHARACTERS } from "./src/characters";
import { annotatePost } from "./src/lib/matching";
import type { FeedPost, Platform } from "./src/types";

// ── Source accounts (X / Twitter) ─────────────────────────────────────────
// A fixed, global set of goods/event/brand accounts to scrape. One populate
// covers everyone, so results are shared regardless of who is subscribed.
// Override with SCRAPE_ACCOUNTS="handle1,handle2" (handy for cheap testing).
const DEFAULT_ACCOUNTS = [
  "genso_journey", "otakumanmulsang", "THorch_KR", "Axez18", "gundam_info",
  "BandaiNamcoKR", "BNKRmall", "comicw", "illustar_fes", "ProjMoonStudio",
  "hamazi__", "animateonlineKR", "Pokemon", "PokemonGoApp", "pokemonkrmkt",
  "AmiAmi_Korean", "megabox_plusm", "dokidokigoods2",
];
const SOURCE_ACCOUNTS = (process.env.SCRAPE_ACCOUNTS
  ? process.env.SCRAPE_ACCOUNTS.split(",").map((s) => s.trim()).filter(Boolean)
  : DEFAULT_ACCOUNTS);

// Which Apify X/Twitter actor to use, and how many tweets per account. Both are
// env-overridable so you can swap actors (e.g. if one blocks free-plan API) or
// raise the count on a paid plan without code changes. The free plan caps the
// actor at 10 items per run, so PER_ACCOUNT defaults to 10.
const TWITTER_ACTOR = process.env.APIFY_TWITTER_ACTOR || "parseforge/x-com-scraper";
const PER_ACCOUNT = Number(process.env.SCRAPE_PER_ACCOUNT) || 10;

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
const STORE_PATH = path.join(process.cwd(), "data", "feed-store.json");
let feedCache: { posts: FeedPost[]; ts: number } | null = null;
let inflight: Promise<FeedPost[]> | null = null;

function loadStore(): void {
  try {
    const data = JSON.parse(readFileSync(STORE_PATH, "utf8"));
    if (Array.isArray(data?.posts)) {
      feedCache = { posts: data.posts as FeedPost[], ts: Number(data.ts) || 0 };
      console.log(`[store] loaded ${feedCache.posts.length} saved posts from disk`);
    }
  } catch {
    /* no store yet — first run */
  }
}

function saveStore(): void {
  try {
    mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    writeFileSync(
      STORE_PATH,
      JSON.stringify({ posts: feedCache?.posts ?? [], ts: feedCache?.ts ?? Date.now() }, null, 2),
    );
  } catch (error) {
    console.error("[store] save failed:", error);
  }
}

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
  return candidates.find((u) => typeof u === "string" && u.startsWith("http"));
}

/** Parse a timestamp that may be ISO string, epoch ms, or epoch seconds. */
function parseTimestamp(v: any): number {
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  if (typeof v === "string") {
    const n = Number(v);
    if (!isNaN(n)) return n < 1e12 ? n * 1000 : n;
    const t = new Date(v).getTime();
    if (!isNaN(t)) return t;
  }
  return Date.now();
}

/** Convert one raw actor item into a FeedPost, or null if it isn't a tweet. */
function toFeedPost(t: any): FeedPost | null {
  if (!t || t.type === "mock_tweet" || t.noResults || t.error) return null;
  const id = String(t.id ?? t.id_str ?? t.tweetId ?? t.rest_id ?? "");
  if (!id) return null;
  const author = t.author ?? t.user ?? {};
  const userName =
    author.userName ?? author.screen_name ?? author.username ?? t.username ?? "unknown";
  return {
    id,
    author: author.name || author.displayName || userName,
    platform: "twitter" as Platform,
    handle: `@${userName}`,
    avatarUrl:
      author.profilePicture ||
      author.profile_image_url_https ||
      author.profileImageUrl ||
      `https://api.dicebear.com/7.x/shapes/svg?seed=${userName}`,
    content: t.text ?? t.full_text ?? t.fullText ?? t.content ?? "",
    imageUrl: extractImage(t),
    timestamp: parseTimestamp(t.createdAt ?? t.created_at ?? t.timestamp ?? t.date),
    link: t.tweetUrl || t.url || t.twitterUrl || `https://x.com/${userName}/status/${id}`,
    source: "live" as const,
  };
}

/**
 * Scrape each source account via a configurable Apify actor. One run per
 * account, because the free plan caps a run at ~10 items — looping is how we
 * cover every account. A single account's failure doesn't abort the rest.
 */
async function scrapeTwitter(token: string): Promise<FeedPost[]> {
  const client = new ApifyClient({ token });
  console.log(`Scraping ${SOURCE_ACCOUNTS.length} handles via "${TWITTER_ACTOR}" (${PER_ACCOUNT}/account)`);
  const posts: FeedPost[] = [];
  for (const handle of SOURCE_ACCOUNTS) {
    try {
      const run = await client.actor(TWITTER_ACTOR).call({
        usernames: [handle],
        twitterHandles: [handle],
        maxItems: PER_ACCOUNT,
        maxTweets: PER_ACCOUNT,
        sort: "Latest",
      });
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
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

/** Scrape, then merge NEW tweets into the persistent store (dedup by id). */
async function scrapeAndStore(token: string): Promise<FeedPost[]> {
  const fresh = await scrapeTwitter(token);
  const existing = feedCache?.posts ?? [];
  const seen = new Set(existing.map((p) => p.id));
  const added = fresh.filter((p) => !seen.has(p.id));
  const merged = [...added, ...existing].sort((a, b) => b.timestamp - a.timestamp);
  feedCache = { posts: merged, ts: Date.now() };
  saveStore();
  console.log(`[scrape] +${added.length} new tweets (total stored: ${merged.length})`);
  return merged;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Load any previously scraped posts so restarts reuse them (no re-scrape).
  loadStore();

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
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.instagram.com/',
        }
      });
      if (!response.ok) {
        return res.status(response.status).send(response.statusText);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
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
      if (inflight) {
        const raw = await inflight;
        return res.json({ posts: respond(raw), live: true, cached: true });
      }
      // Cache still fresh enough → don't scrape again yet.
      if (feedCache && cacheAge < FORCE_MIN_MS) {
        return res.json({ posts: respond(feedCache.posts), live: true, cached: true });
      }
      // Otherwise, launch a single scrape that everyone shares. It merges any
      // new tweets into the persistent store (dedup by id) and updates feedCache.
      inflight = scrapeAndStore(token).finally(() => {
        inflight = null;
      });
      const raw = await inflight;
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
    try {
      const params = new URLSearchParams({
        client: "gtx",
        sl: "auto",
        tl: target || "ko",
        dt: "t",
        q: text,
      });
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
      if (!response.ok) {
        throw new Error(`translate endpoint responded ${response.status}`);
      }
      const data = (await response.json()) as any;
      const translated = (data?.[0] ?? [])
        .map((chunk: any) => chunk?.[0] ?? "")
        .join("")
        .trim();
      res.json({ translated: translated || null });
    } catch (error: any) {
      console.error("[translate] Error:", error);
      res.json({ translated: null, error: error.message || "translation failed" });
    }
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
