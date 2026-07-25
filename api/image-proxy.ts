import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchProxiedImage } from '../src/server/imageProxy';

// Vercel counterpart to the Express /api/image-proxy route in server.ts.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.query.url;
  if (!url || typeof url !== 'string') {
    res.status(400).send('URL is required');
    return;
  }
  try {
    const result = await fetchProxiedImage(url);
    if (!result.ok) {
      res.status(result.status).send(result.statusText);
      return;
    }
    res.setHeader('Content-Type', result.contentType!);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(result.buffer);
  } catch (error) {
    console.error('[image-proxy] Error:', error);
    res.status(500).send('Failed to fetch image');
  }
}
