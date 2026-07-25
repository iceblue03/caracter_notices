import { Character, Work, WorkCharacter } from './types';
import worksData from './works.json';
import characterFillsData from './characterFills.json';
import { ANIME_TITLES } from './animeTitles';
import { getBackgroundImage } from './workBackgrounds';

/**
 * The classifier taxonomy. `works.json` is the source of truth: a scaffolded
 * list of works, each with a slot for `aliases` and a handful of representative
 * `characters` that a sub-model fills in later.
 *
 * For the rest of the app we bridge each Work to one work-level `Character`
 * entry (kind: 'work') so all existing components (Discover, feed, detail)
 * keep working unchanged, AND expand every representative character into its
 * own character-level `Character` entry (kind: 'character') so users can
 * subscribe to just that character. A work's match terms = its aliases + every
 * representative character's name & aliases, plus the work title itself (via
 * `name`) — so a work still matches posts even before its aliases/characters
 * are filled in, and subscribing to the work is always a superset of
 * subscribing to any one of its characters.
 */
const CURATED_WORKS = worksData as Work[];

/**
 * `works.json` only hand-curates representative characters for a subset of
 * works; `characterFills.json` is a bulk import (title -> characters) covering
 * the rest. A work that already has `characters` filled always wins — this
 * only ever fills in the gap, never overrides hand-curated data.
 */
const CHARACTER_FILLS = characterFillsData as Record<string, WorkCharacter[]>;

// `works.json` contains the curated classifier data. Keep the rest of the CSV
// selectable too; these entries can already match their exact title and can be
// enriched with aliases/characters later without changing their stable id.
//
// Curated titles don't sit in the same order as the CSV (some curated works
// were entered out of sequence, and a few CSV titles were skipped entirely
// during curation), so a positional slice would both silently drop titles
// that happen to fall before the curated cutoff and duplicate titles that
// happen to fall after it. Filtering by title instead keeps every CSV title
// that isn't already represented by a curated work — no drops, no duplicates.
const CURATED_TITLES = new Set(CURATED_WORKS.map((w) => w.title));
const CSV_WORKS: Work[] = ANIME_TITLES.filter((title) => !CURATED_TITLES.has(title)).map(
  (title, offset) => ({
    id: `csv${String(CURATED_WORKS.length + offset + 1).padStart(3, '0')}`,
    title,
    category: '기타 콘텐츠',
    aliases: [],
    characters: [],
  }),
);

export const WORKS: Work[] = [...CURATED_WORKS, ...CSV_WORKS].map((work) =>
  work.characters.length > 0
    ? work
    : { ...work, characters: CHARACTER_FILLS[work.title] ?? [] },
);

// Deterministic, copyright-safe visuals derived from the entry's own id
// (stable across reloads, no artwork involved). Characters and works share
// this pool, hashed off their own id, so siblings within a work still land on
// visually distinct emoji/gradients.
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

function categoryEnOf(category: string): string {
  return category === '게임' ? 'Game' : category === '애니메이션' ? 'Anime' : 'Contents';
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
    series: work.title,
    seriesEn: nameEn,
    category: work.category,
    categoryEn: categoryEnOf(work.category),
    kind: 'work',
    role: repNames.length ? repNames.join(' · ') : '대표 캐릭터 미정',
    emoji,
    color: gradient[1],
    gradient,
    backgroundImage: getBackgroundImage(work.title),
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
 * One representative character within `work`, as its own subscribable
 * catalog entry. No character art exists for any of these, so — same as any
 * work with no cover image on disk — it always falls back to the deterministic
 * gradient avatar rather than inventing a visual treatment that would make
 * some entries look "finished" and others not.
 */
function toChildCharacter(work: Work, parent: Character, wc: WorkCharacter, index: number): Character {
  const id = `${work.id}c${index + 1}`;
  const gradient = GRADIENTS[hash(id) % GRADIENTS.length];
  const emoji = EMOJI_POOL[hash(id) % EMOJI_POOL.length];
  const nameEn = wc.aliases.find((a) => /[a-z]/i.test(a)) ?? '';
  const keywords = [...new Set([wc.name, ...wc.aliases].filter(Boolean))];

  return {
    id,
    name: wc.name,
    nameEn,
    series: work.title,
    seriesEn: parent.nameEn,
    category: work.category,
    categoryEn: parent.categoryEn,
    kind: 'character',
    workId: work.id,
    role: '대표 캐릭터',
    emoji,
    color: gradient[1],
    gradient,
    backgroundImage: undefined,
    popularity: parent.popularity,
    tagline: `「${work.title}」에 등장하는 캐릭터예요. 구독하면 이 캐릭터 소식만 모아볼 수 있어요.`,
    keywords,
    hashtags: [],
    sourceAccounts: [],
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
  category: '기타',
  categoryEn: 'Uncategorized',
  kind: 'work',
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

const WORK_CHARACTERS: Character[] = WORKS.map(toCharacter);
const CHILD_CHARACTERS: Character[] = WORKS.flatMap((work, index) =>
  work.characters.map((wc, i) => toChildCharacter(work, WORK_CHARACTERS[index], wc, i)),
);

export const CHARACTERS: Character[] = [...WORK_CHARACTERS, ...CHILD_CHARACTERS, MISC_CHARACTER];

export const CHARACTER_MAP: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);

export function getCharacter(id: string): Character | undefined {
  return CHARACTER_MAP[id];
}

const CHILDREN_BY_WORK_ID = new Map<string, Character[]>();
for (const c of CHILD_CHARACTERS) {
  const list = CHILDREN_BY_WORK_ID.get(c.workId!) ?? [];
  list.push(c);
  CHILDREN_BY_WORK_ID.set(c.workId!, list);
}

/** A work's representative characters, in curation order — empty if none are picked yet. */
export function getChildCharacters(workId: string): Character[] {
  return CHILDREN_BY_WORK_ID.get(workId) ?? [];
}

/** All distinct content categories, ordered by their most popular work. Work-level entries only — a work's own characters render inline on its card instead of forming their own category groups. */
export function getCategoryList(): { category: string; categoryEn: string; characters: Character[] }[] {
  const byCategory = new Map<string, Character[]>();
  for (const c of CHARACTERS) {
    if (c.kind !== 'work') continue;
    const list = byCategory.get(c.category) ?? [];
    list.push(c);
    byCategory.set(c.category, list);
  }
  return [...byCategory.entries()]
    .map(([category, characters]) => ({
      category,
      categoryEn: characters[0].categoryEn,
      characters: characters.slice().sort((a, b) => b.popularity - a.popularity),
    }))
    .sort(
      (a, b) =>
        Math.max(...b.characters.map((c) => c.popularity)) -
        Math.max(...a.characters.map((c) => c.popularity)),
    );
}
