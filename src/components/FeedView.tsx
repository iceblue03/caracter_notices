import { useEffect, useMemo, useState } from 'react';
import { Compass, CircleOff, Inbox, ShoppingBag, ChevronRight, Search, X } from 'lucide-react';
import { Character, FeedPost, GoodsListing } from '../types';
import { EventFeature } from '../events';
import { trackFeatureUse } from '../lib/analytics';
import { MISC_ID, getChildCharacters } from '../characters';
import { EventBanner } from './EventBanner';
import { PostCard } from './PostCard';
import { GoodsCard } from './GoodsCard';
import { CharacterCard } from './CharacterCard';
import { FilterPill } from './FilterPill';

interface Props {
  subscribed: Character[];
  posts: FeedPost[]; // already filtered to subscriptions, annotated, newest-first
  /** Goods listings matched to each character id — mixed into the feed when that character is the active filter. */
  goodsByCharacter: Record<string, GoodsListing[]>;
  /** Real events announced in the collected posts, soonest-first. */
  events: EventFeature[];
  live: boolean;
  syncNote?: string;
  onSelectCharacter: (id: string) => void;
  /** Jump to Discover, optionally handing off the current search query. */
  onDiscover: (query?: string) => void;
  /** Jump to the Goods tab, optionally pre-filtered to a character. */
  onOpenGoods: (characterId?: string) => void;
  /** Full catalog + every known post/listing (not just subscriptions) — powers the home feed's "전체 검색". */
  allCharacters: Character[];
  allPosts: FeedPost[];
  allGoods: GoodsListing[];
  isSubscribed: (id: string) => boolean;
  postCounts: Record<string, number>;
  onToggleSubscribe: (id: string) => void;
}

type FeedEntry =
  | { kind: 'post'; key: string; timestamp: number; post: FeedPost }
  | { kind: 'goods'; key: string; timestamp: number; listing: GoodsListing };

// Goods should read as a light seasoning in the feed, not the main course —
// cap them to roughly 1-in-4 posts and, when there are more matches than
// that budget allows, pick evenly across the (already recency-sorted) list
// instead of just the newest ones, so the sample isn't all from one burst.
const GOODS_PER_POSTS = 4;

function sampleEvenly<T>(items: T[], count: number): T[] {
  if (count <= 0) return [];
  if (count >= items.length) return items;
  const step = items.length / count;
  return Array.from({ length: count }, (_, i) => items[Math.floor(i * step)]);
}

export function FeedView({
  subscribed,
  posts,
  goodsByCharacter,
  events,
  live,
  syncNote,
  onSelectCharacter,
  onDiscover,
  onOpenGoods,
  allCharacters,
  allPosts,
  allGoods,
  isSubscribed,
  postCounts,
  onToggleSubscribe,
}: Props) {
  const [filter, setFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');

  // Filter rail always shows every subscription, one row, by title.
  const railCharacters = subscribed;

  const visiblePosts = useMemo(() => {
    if (filter === 'all') return posts;
    return posts.filter((p) => p.matches?.some((m) => m.characterId === filter));
  }, [posts, filter]);

  // Goods listings for the currently-selected character only — kept out of
  // "전체" so the unfiltered feed isn't cluttered with every character's
  // matched listings (매물) at once. Picking a character mixes theirs in.
  const selectedGoods = useMemo(
    () => (filter === 'all' ? [] : goodsByCharacter[filter] ?? []),
    [filter, goodsByCharacter],
  );

  const visibleEntries = useMemo<FeedEntry[]>(() => {
    const postEntries: FeedEntry[] = visiblePosts.map((post) => ({
      kind: 'post',
      key: `post:${post.id}`,
      timestamp: post.timestamp,
      post,
    }));
    if (selectedGoods.length === 0) return postEntries;

    const goodsBudget = Math.max(1, Math.ceil(postEntries.length / GOODS_PER_POSTS));
    const cappedGoods = sampleEvenly(selectedGoods, goodsBudget);
    const goodsEntries: FeedEntry[] = cappedGoods.map((listing) => ({
      kind: 'goods',
      key: `goods:${listing.id}`,
      timestamp: listing.timestamp,
      listing,
    }));
    return [...postEntries, ...goodsEntries].sort((a, b) => b.timestamp - a.timestamp);
  }, [visiblePosts, selectedGoods]);

  const subscribedIds = useMemo(() => subscribed.map((c) => c.id), [subscribed]);

  useEffect(() => {
    if (filter !== 'all' && !railCharacters.some((c) => c.id === filter)) setFilter('all');
  }, [filter, railCharacters]);

  // "전체 검색" — searches the whole catalog/post/goods pool, not just what's
  // subscribed, so this doubles as a discovery tool right from the home feed.
  const searchQuery = searchInput.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!searchQuery) return null;
    const characters = allCharacters
      .filter((c) => c.id !== MISC_ID)
      .filter((c) =>
        [c.name, c.nameEn, c.series, c.seriesEn, c.role, ...c.keywords].some((f) =>
          f.toLowerCase().includes(searchQuery),
        ),
      )
      .sort((a, b) => b.popularity - a.popularity);
    const posts = allPosts.filter((p) =>
      `${p.content} ${p.author}`.toLowerCase().includes(searchQuery),
    );
    const goods = allGoods.filter((g) =>
      `${g.title} ${g.description ?? ''}`.toLowerCase().includes(searchQuery),
    );
    return { characters, posts, goods };
  }, [searchQuery, allCharacters, allPosts, allGoods]);

  // Debounced so a whole search term is tracked once it settles, not per keystroke.
  useEffect(() => {
    if (!searchQuery || !searchResults) return;
    const timer = setTimeout(() => {
      trackFeatureUse('global_search', {
        query: searchQuery,
        characterCount: searchResults.characters.length,
        postCount: searchResults.posts.length,
        goodsCount: searchResults.goods.length,
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, searchResults]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Featured real-world event, pulled from the collected posts — hidden while searching so results aren't buried */}
      {!searchResults && <EventBanner features={events} />}

      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">홈 피드</h1>
          <p className="text-sm text-slate-500 mt-1">
            {live ? (
              <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                <CircleOff size={13} /> 동기화 중단됨
              </span>
            ) : (
              '최애 캐릭터의 소식만 모았어요'
            )}
          </p>
        </div>
      </div>

      {/* Global search — spans every character/work, post, and goods listing, not just subscriptions */}
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="전체 검색 · 캐릭터·작품·게시물·굿즈"
          className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            aria-label="검색어 지우기"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {searchResults ? (
        <SearchResults
          query={searchInput.trim()}
          characters={searchResults.characters}
          posts={searchResults.posts}
          goods={searchResults.goods}
          isSubscribed={isSubscribed}
          postCounts={postCounts}
          onToggleSubscribe={onToggleSubscribe}
          onSelectCharacter={onSelectCharacter}
          onSeeMoreCharacters={() => onDiscover(searchInput.trim())}
        />
      ) : subscribed.length === 0 ? (
        <EmptyFeed onDiscover={() => onDiscover()} />
      ) : (
        <>
          {/* Filter rail — one row, plain title text (no avatar art, so a
              missing/broken image file never distorts the row). */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 mb-2 scrollbar-none">
            <FilterPill active={filter === 'all'} onClick={() => setFilter('all')} compact>
              전체
            </FilterPill>
            {railCharacters.map((c) => (
              <FilterPill
                key={c.id}
                active={filter === c.id}
                onClick={() => {
                  if (filter !== c.id) trackFeatureUse('filter_character', { id: c.id, name: c.name });
                  setFilter((current) => (current === c.id ? 'all' : c.id));
                }}
                compact
              >
                {c.name}
              </FilterPill>
            ))}
          </div>

          {syncNote && (
            <div className="mb-4 text-xs text-slate-400 bg-slate-100/70 rounded-lg px-3 py-2">
              {syncNote}
            </div>
          )}

          {/* When a specific character is selected, surface a shortcut to their full goods listing */}
          {filter !== 'all' && selectedGoods.length > 0 && (
            <button
              onClick={() => onOpenGoods(filter)}
              className="w-full flex items-center justify-between gap-2 mb-4 px-3.5 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 transition-colors"
            >
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <ShoppingBag size={15} /> 이 캐릭터 굿즈 매물 {selectedGoods.length}건
              </span>
              <ChevronRight size={16} />
            </button>
          )}

          {/* Posts (+ that character's goods listings, mixed in by recency) */}
          {visibleEntries.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Inbox size={32} className="mx-auto mb-3 opacity-60" />
              <p className="font-medium text-slate-500">아직 이 캐릭터의 새 소식이 없어요</p>
              <p className="text-sm mt-1">‘새 소식’을 눌러 SNS에서 최신 게시물을 불러와 보세요.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {visibleEntries.map((entry) =>
                entry.kind === 'post' ? (
                  <PostCard
                    key={entry.key}
                    post={entry.post}
                    highlightIds={subscribedIds}
                    onSelectCharacter={onSelectCharacter}
                  />
                ) : (
                  <GoodsCard
                    key={entry.key}
                    listing={entry.listing}
                    variant="feed"
                    onSelectCharacter={onSelectCharacter}
                  />
                ),
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyFeed({ onDiscover }: { onDiscover: () => void }) {
  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center text-white mb-5 shadow-lg shadow-violet-200">
        <Compass size={30} />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900">최애를 골라주세요</h2>
      <p className="text-slate-500 mt-2 leading-relaxed">
        좋아하는 캐릭터를 구독하면, SNS에 흩어진 소식 중<br />
        그 캐릭터와 관련된 게시물만 이 피드에 모여요.
      </p>
      <button
        onClick={onDiscover}
        className="mt-6 inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-violet-700 transition-colors"
      >
        <Compass size={17} /> 캐릭터 탐색하기
      </button>
    </div>
  );
}

const SEARCH_CHARACTER_LIMIT = 6;
const SEARCH_POST_LIMIT = 10;
const SEARCH_GOODS_LIMIT = 6;

/** "전체 검색" results — characters/works to subscribe to, plus any matching posts/goods, from the whole catalog. */
function SearchResults({
  query,
  characters,
  posts,
  goods,
  isSubscribed,
  postCounts,
  onToggleSubscribe,
  onSelectCharacter,
  onSeeMoreCharacters,
}: {
  query: string;
  characters: Character[];
  posts: FeedPost[];
  goods: GoodsListing[];
  isSubscribed: (id: string) => boolean;
  postCounts: Record<string, number>;
  onToggleSubscribe: (id: string) => void;
  onSelectCharacter: (id: string) => void;
  onSeeMoreCharacters: () => void;
}) {
  if (characters.length === 0 && posts.length === 0 && goods.length === 0) {
    return (
      <p className="text-center text-slate-400 py-16">
        ‘{query}’에 해당하는 결과를 찾지 못했어요.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {characters.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            캐릭터 · 작품 {characters.length}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {characters.slice(0, SEARCH_CHARACTER_LIMIT).map((c) => (
              <CharacterCard
                key={c.id}
                character={c}
                subscribed={isSubscribed(c.id)}
                postCount={postCounts[c.id]}
                onToggle={() => onToggleSubscribe(c.id)}
                onOpen={() => onSelectCharacter(c.id)}
                childCharacters={c.kind === 'work' ? getChildCharacters(c.id) : undefined}
                isChildSubscribed={isSubscribed}
                onToggleChild={onToggleSubscribe}
              />
            ))}
          </div>
          {characters.length > SEARCH_CHARACTER_LIMIT && (
            <button
              onClick={onSeeMoreCharacters}
              className="mt-3 text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              캐릭터 탐색에서 {characters.length - SEARCH_CHARACTER_LIMIT}개 더 보기 →
            </button>
          )}
        </section>
      )}

      {posts.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            게시물 {posts.length}
          </h2>
          <div className="space-y-5">
            {posts.slice(0, SEARCH_POST_LIMIT).map((post) => (
              <PostCard key={post.id} post={post} highlightIds={[]} onSelectCharacter={onSelectCharacter} />
            ))}
          </div>
        </section>
      )}

      {goods.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            굿즈 매물 {goods.length}
          </h2>
          <div className="space-y-3">
            {goods.slice(0, SEARCH_GOODS_LIMIT).map((listing) => (
              <GoodsCard key={listing.id} listing={listing} variant="feed" onSelectCharacter={onSelectCharacter} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
