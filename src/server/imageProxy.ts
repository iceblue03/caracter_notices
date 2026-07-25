export interface ProxiedImage {
  ok: boolean;
  status: number;
  statusText?: string;
  contentType?: string;
  buffer?: Buffer;
}

/**
 * Instagram CDN images block hot-linking; fetch them with an Instagram
 * referer so the browser can display them via our own origin instead.
 * Shared by server.ts (Express) and api/image-proxy.ts (Vercel).
 */
export async function fetchProxiedImage(url: string): Promise<ProxiedImage> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      Referer: 'https://www.instagram.com/',
    },
  });
  if (!response.ok) {
    return { ok: false, status: response.status, statusText: response.statusText };
  }
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await response.arrayBuffer());
  return { ok: true, status: 200, contentType, buffer };
}
