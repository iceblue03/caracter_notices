import { Character, FeedPost, PostMatch } from '../types';

/** Lowercase + collapse whitespace so matching is case/spacing-insensitive. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Returns every character whose keywords/hashtags appear in `text`, ranked by
 * how many distinct terms matched. This is the core of the "show only posts
 * about my character" filter.
 */
export function matchText(text: string, characters: Character[]): PostMatch[] {
  const haystack = normalize(text);
  const results: PostMatch[] = [];

  for (const character of characters) {
    const matched = new Set<string>();
    const candidates = [
      ...character.keywords,
      ...character.hashtags,
      character.name,
      character.nameEn,
    ];
    for (const raw of candidates) {
      const term = normalize(raw);
      if (term.length < 2) continue; // avoid matching single characters
      if (haystack.includes(term)) matched.add(raw);
    }
    if (matched.size > 0) {
      results.push({
        characterId: character.id,
        score: matched.size,
        terms: [...matched],
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/** Text we scan for a post: caption + author help catch official-account posts. */
function postHaystack(post: FeedPost): string {
  return `${post.content} ${post.author} ${post.handle}`;
}

/** Annotate a single post with the characters it mentions. */
export function annotatePost(post: FeedPost, characters: Character[]): FeedPost {
  return { ...post, matches: matchText(postHaystack(post), characters) };
}

/**
 * Annotate every post, then keep only those relevant to at least one of the
 * given characters. Posts are returned newest-first.
 */
export function filterPostsForCharacters(
  posts: FeedPost[],
  characters: Character[],
): FeedPost[] {
  const wanted = new Set(characters.map((c) => c.id));
  return posts
    .map((post) => annotatePost(post, characters))
    .filter((post) => post.matches!.some((m) => wanted.has(m.characterId)))
    .sort((a, b) => b.timestamp - a.timestamp);
}
