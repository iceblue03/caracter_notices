import type { VercelRequest, VercelResponse } from '@vercel/node';
import { translateText } from '../src/server/translate';

// Vercel serverless counterpart to the Express /api/translate route in
// server.ts (which only runs during local dev / a self-hosted deploy —
// vercel.json builds just the static Vite frontend, so without this file
// the "번역" button 404s in production). Both share translateText().
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ translated: null, error: 'method not allowed' });
    return;
  }
  const { text, target } = (req.body ?? {}) as { text?: string; target?: string };
  if (!text) {
    res.status(400).json({ translated: null, error: 'text required' });
    return;
  }
  const result = await translateText(text, target || 'ko');
  res.status(200).json(result);
}
