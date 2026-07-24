import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { ApifyClient } from "apify-client";
import cors from "cors";
import { CHARACTERS } from "./src/characters";
import { filterPostsForCharacters } from "./src/lib/matching";
import type { Character, FeedPost, Platform } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

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

  // ── Character-filtered live feed ───────────────────────────────────────
  // Scrapes the given SNS accounts via Apify, then keeps only the posts that
  // are relevant to the subscribed characters. This is where the completed
  // scraping logic meets the character subscription model.
  app.post("/api/feed/sync", async (req, res) => {
    const token = process.env.APIFY_API_TOKEN;
    const { accounts, characterIds } = req.body as {
      accounts?: string[];
      characterIds?: string[];
    };

    // Resolve which characters to filter against.
    const characters: Character[] = Array.isArray(characterIds) && characterIds.length
      ? CHARACTERS.filter((c) => characterIds.includes(c.id))
      : CHARACTERS;

    // Determine which accounts to scrape (fall back to the characters' sources).
    const usernames = Array.isArray(accounts) && accounts.length
      ? accounts
      : [...new Set(characters.flatMap((c) => c.sourceAccounts))];

    // No token → not an error; the client keeps its sample feed.
    if (!token) {
      return res.json({ posts: [], live: false, reason: "no-token" });
    }
    if (usernames.length === 0) {
      return res.json({ posts: [], live: false, reason: "no-accounts" });
    }

    try {
      const client = new ApifyClient({ token });
      const input = {
        directUrls: usernames.map((u) => `https://www.instagram.com/${u}/`),
        resultsType: "details",
      };

      console.log("Starting Apify Instagram scraper for:", usernames);
      const run = await client.actor("apify/instagram-scraper").call(input);
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      console.log(`Fetched ${items.length} profiles from Apify`);

      const rawPosts: FeedPost[] = [];
      for (const profile of items as any[]) {
        if (!Array.isArray(profile.latestPosts)) continue;
        const username = profile.username || profile.fullName || "unknown";
        for (const post of profile.latestPosts.slice(0, 6)) {
          const ts = post.timestamp ? new Date(post.timestamp).getTime() : Date.now();
          rawPosts.push({
            id: String(post.id ?? post.shortCode ?? Math.random()),
            author: profile.fullName || username,
            platform: "instagram" as Platform,
            handle: `@${username}`,
            avatarUrl:
              profile.profilePicUrl ||
              `https://api.dicebear.com/7.x/shapes/svg?seed=${username}`,
            content: post.caption || "",
            imageUrl: post.displayUrl || post.videoUrl || undefined,
            timestamp: isNaN(ts) ? Date.now() : ts,
            link: post.url || `https://www.instagram.com/p/${post.shortCode}/`,
            source: "live" as const,
          });
        }
      }

      // Keep only posts relevant to the subscribed characters, annotated with
      // which character(s) they matched.
      const posts = filterPostsForCharacters(rawPosts, characters);
      console.log(`Matched ${posts.length}/${rawPosts.length} live posts to characters`);

      res.json({ posts, live: true });
    } catch (error: any) {
      console.error("Apify API error:", error);
      res.status(502).json({ posts: [], live: false, error: error.message || "Failed to fetch from Apify" });
    }
  });

  // ── Optional AI summary ────────────────────────────────────────────────
  // Uses server-side Gemini (if GEMINI_API_KEY is set) to summarise a post for
  // a fan. Degrades gracefully to { available: false } when not configured.
  app.post("/api/ai/summarize", async (req, res) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({ available: false, summary: null });
    }
    const { content, character } = req.body as { content?: string; character?: string };
    if (!content) {
      return res.status(400).json({ available: true, summary: null, error: "content required" });
    }
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt =
        `너는 애니 굿즈/소식 큐레이터야. 아래 SNS 게시물을` +
        (character ? ` '${character}' 캐릭터의 팬 관점에서` : "") +
        ` 핵심만 한국어 한 문장(45자 이내)으로 요약해줘. 해시태그와 이모지는 빼고, 담백하게.\n\n게시물:\n${content}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const summary = (response.text || "").trim();
      res.json({ available: true, summary: summary || null });
    } catch (error: any) {
      console.error("[ai/summarize] Error:", error);
      res.json({ available: true, summary: null, error: error.message || "AI request failed" });
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
