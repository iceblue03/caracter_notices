/** Format an epoch-ms timestamp as a Korean relative time, e.g. "3시간 전". */
export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 0) return '방금 전';
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}주 전`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}개월 전`;
  return `${Math.floor(day / 365)}년 전`;
}

/**
 * Instagram/Facebook CDN images block hot-linking, so route those through the
 * server image proxy. Everything else (Unsplash, DiceBear, etc.) loads directly.
 */
export function imageSrc(url?: string): string | undefined {
  if (!url) return undefined;
  if (/cdninstagram\.com|fbcdn\.net|instagram\.f/.test(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/** A soft `linear-gradient(...)` string built from a two-stop gradient. */
export function gradientStyle([from, to]: [string, string], angle = 135): string {
  return `linear-gradient(${angle}deg, ${from}, ${to})`;
}

/** Deterministic pleasant HSL color from a string, for avatar fallbacks. */
export function colorFromString(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 62% 52%)`;
}
