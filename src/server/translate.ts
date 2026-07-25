export interface TranslateResult {
  translated: string | null;
  error?: string;
}

/**
 * Uses Google's free, unofficial "gtx" translate endpoint (the same one
 * browser extensions use) — no API key or billing account needed. It's
 * unsupported/undocumented, so treat failures as routine and degrade
 * gracefully rather than surfacing them as errors.
 *
 * Shared by the local Express server (server.ts) and the Vercel serverless
 * function (api/translate.ts) so the two runtimes can't drift apart.
 */
export async function translateText(text: string, target = 'ko'): Promise<TranslateResult> {
  try {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: 'auto',
      tl: target || 'ko',
      dt: 't',
      q: text,
    });
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
    if (!response.ok) {
      throw new Error(`translate endpoint responded ${response.status}`);
    }
    const data = (await response.json()) as any;
    const translated = (data?.[0] ?? [])
      .map((chunk: any) => chunk?.[0] ?? '')
      .join('')
      .trim();
    return { translated: translated || null };
  } catch (error: any) {
    console.error('[translate] Error:', error);
    return { translated: null, error: error.message || 'translation failed' };
  }
}
