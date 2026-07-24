import { Character, Work } from './types';
import worksData from './works.json';

/**
 * The classifier taxonomy. `works.json` is the source of truth: a scaffolded
 * list of works, each with a slot for `aliases` and 2-3 representative
 * `characters` that a sub-model fills in later.
 *
 * For the rest of the app we bridge each Work to one `Character` entry so all
 * existing components (Discover, feed, detail) keep working unchanged. A work's
 * match terms = its aliases + every representative character's name & aliases,
 * plus the work title itself (via `name`). This means a work matches posts even
 * before its aliases/characters are filled in.
 */
export const WORKS = worksData as Work[];

// Deterministic, copyright-safe visuals derived from the work id (stable across
// reloads, no artwork involved).
const EMOJI_POOL = [
  '🌀', '✨', '🔥', '🌸', '⭐', '🎋', '🗡️', '⚡', '🎮', '🐉',
  '🍥', '🎧', '🌙', '💫', '🎨', '🩸', '👊', '🛡️', '🎭', '🧪',
  '🏐', '⚔️', '🌊', '🎯', '👑', '🦊', '🐰', '🎪', '💥', '🕹️',
];

const GRADIENTS: [string, string][] = [
  ['#60a5fa', '#4338ca'], ['#f9a8d4', '#db2777'], ['#fda4af', '#be123c'],
  ['#fbbf24', '#c2410c'], ['#c4b5fd', '#7c3aed'], ['#67e8f9', '#0891b2'],
  ['#86efac', '#15803d'], ['#fca5a5', '#b91c1c'], ['#a5b4fc', '#4f46e5'],
  ['#f0abfc', '#a21caf'], ['#fdba74', '#ea580c'], ['#5eead4', '#0f766e'],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function toCharacter(work: Work, index: number): Character {
  const gradient = GRADIENTS[hash(work.id) % GRADIENTS.length];
  const emoji = EMOJI_POOL[hash(work.id) % EMOJI_POOL.length];
  const charTerms = work.characters.flatMap((c) => [c.name, ...c.aliases]);
  const keywords = [...new Set([...work.aliases, ...charTerms].filter(Boolean))];
  const nameEn = work.aliases.find((a) => /[a-z]/i.test(a)) ?? '';
  const repNames = work.characters.map((c) => c.name);

  return {
    id: work.id,
    name: work.title,
    nameEn,
    series: work.category,
    seriesEn: work.category === '게임' ? 'Game' : 'Anime',
    role: repNames.length ? repNames.join(' · ') : '대표 캐릭터 미정',
    emoji,
    color: gradient[1],
    gradient,
    // Preserve the provided ordering as a popularity hint (earlier = higher).
    popularity: WORKS.length - index,
    tagline: repNames.length
      ? `대표 캐릭터: ${repNames.join(', ')}`
      : '대표 캐릭터가 아직 정해지지 않았어요.',
    keywords,
    hashtags: [],
    sourceAccounts: [], // sources are now global (see SOURCE_ACCOUNTS in server.ts)
  };
}

/**
 * Fallback bucket for posts that don't match any work's keywords. Without
 * this, a post with zero matches would be silently dropped from every feed
 * view — appending this to CHARACTERS guarantees every post lands somewhere.
 */
export const MISC_ID = 'misc';

const MISC_CHARACTER: Character = {
  id: MISC_ID,
  name: '기타',
  nameEn: 'Uncategorized',
  series: '기타',
  seriesEn: 'Uncategorized',
  role: '분류되지 않은 소식',
  emoji: '📰',
  color: '#64748b',
  gradient: ['#94a3b8', '#334155'],
  popularity: -1, // sorts last everywhere popularity is used
  tagline: '어떤 작품 키워드에도 걸리지 않은 소식이 여기 모여요.',
  keywords: [],
  hashtags: [],
  sourceAccounts: [],
};

export const CHARACTERS: Character[] = [...WORKS.map(toCharacter), MISC_CHARACTER];

export const CHARACTER_MAP: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);

export function getCharacter(id: string): Character | undefined {
  return CHARACTER_MAP[id];
}

/** All distinct series (categories), ordered by combined popularity. */
export function getSeriesList(): { series: string; seriesEn: string; characters: Character[] }[] {
  const bySeries = new Map<string, Character[]>();
  for (const c of CHARACTERS) {
    const list = bySeries.get(c.series) ?? [];
    list.push(c);
    bySeries.set(c.series, list);
  }
  return [...bySeries.entries()]
    .map(([series, characters]) => ({
      series,
      seriesEn: characters[0].seriesEn,
      characters: characters.slice().sort((a, b) => b.popularity - a.popularity),
    }))
    .sort(
      (a, b) =>
        Math.max(...b.characters.map((c) => c.popularity)) -
        Math.max(...a.characters.map((c) => c.popularity)),
    );
}
