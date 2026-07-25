import { Character, FeedPost, GoodsListing, PostMatch } from '../types';
import { MISC_ID } from '../characters';

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

/**
 * Annotate a single post with the characters/works it mentions. If nothing
 * matches, fall back to the "기타" bucket (MISC_ID) so no post is ever left
 * unclassified or silently dropped from the feed.
 */
export function annotatePost(post: FeedPost, characters: Character[]): FeedPost {
  const matches = matchText(postHaystack(post), characters);
  if (matches.length === 0) {
    return { ...post, matches: [{ characterId: MISC_ID, score: 0, terms: [] }] };
  }
  return { ...post, matches };
}

/** Text we scan for a goods listing: title + description. */
function goodsHaystack(listing: GoodsListing): string {
  return `${listing.title} ${listing.description ?? ''}`;
}

/** Same as annotatePost, for marketplace listings (Goods tab). */
export function annotateGoods(listing: GoodsListing, characters: Character[]): GoodsListing {
  const matches = matchText(goodsHaystack(listing), characters);
  if (matches.length === 0) {
    return { ...listing, matches: [{ characterId: MISC_ID, score: 0, terms: [] }] };
  }
  return { ...listing, matches };
}
