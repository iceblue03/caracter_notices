import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { ApifyClient } from "apify-client";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.get("/api/image-proxy", async (req, res) => {
    const url = req.query.url as string;
    console.log("[image-proxy] Request received for URL:", url);
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
      console.log(`[image-proxy] Fetch status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        return res.status(response.status).send(response.statusText);
      }
      
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      const buffer = await response.arrayBuffer();
      console.log(`[image-proxy] Returning ${buffer.byteLength} bytes of type ${contentType}`);
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("[image-proxy] Error:", error);
      res.status(500).send("Failed to fetch image");
    }
  });

  // Apify integration endpoint
  app.post("/api/instagram/sync", async (req, res) => {
    try {
      const token = process.env.APIFY_API_TOKEN;
      if (!token) {
        return res.status(500).json({ error: "APIFY_API_TOKEN is not configured in secrets." });
      }

      const { usernames } = req.body;
      if (!usernames || !Array.isArray(usernames)) {
        return res.status(400).json({ error: "usernames array is required" });
      }

      const client = new ApifyClient({ token });

      // Using apify/instagram-scraper with resultsType: "details"
      const input = {
        directUrls: usernames.map(u => `https://www.instagram.com/${u}/`),
        resultsType: "details",
      };

      console.log("Starting Apify Instagram scraper for profiles:", usernames);
      const run = await client.actor("apify/instagram-scraper").call(input);
      console.log("Apify run finished:", run.id);

      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      console.log(`Fetched ${items.length} profiles from Apify`);

      const formattedFeeds: any[] = [];
      
      for (const profile of items) {
        if (!profile.latestPosts) continue;
        
        // Take up to 3 latest posts per profile
        const recentPosts = profile.latestPosts.slice(0, 3);
        
        for (const post of recentPosts) {
          formattedFeeds.push({
            id: post.id || Math.random().toString(),
            shopName: profile.username || profile.fullName || 'Unknown',
            platform: 'instagram' as const,
            handle: `@${profile.username || 'unknown'}`,
            avatarUrl: profile.profilePicUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${profile.username}`,
            content: post.caption || '',
            imageUrl: post.displayUrl || post.videoUrl || '',
            postedAt: post.timestamp ? new Date(post.timestamp).toLocaleString() : new Date().toLocaleString(),
            link: post.url || `https://www.instagram.com/p/${post.shortCode}/`
          });
        }
      }

      res.json({ feeds: formattedFeeds });
    } catch (error: any) {
      console.error("Apify API error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch from Apify" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
