import { useEffect, useMemo, useState } from 'react';
import { Compass, CircleOff, Inbox, ShoppingBag, ChevronRight } from 'lucide-react';
import { Character, FeedPost, GoodsListing } from '../types';
import { EventFeature } from '../events';
import { trackFeatureUse } from '../lib/analytics';
import { EventBanner } from './EventBanner';
import { PostCard } from './PostCard';
import { GoodsCard } from './GoodsCard';
import { CharacterAvatar } from './CharacterAvatar';
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
  onDiscover: () => void;
  /** Jump to the Goods tab, optionally pre-filtered to a character. */
  onOpenGoods: (characterId?: string) => void;
}

type FeedEntry =
  | { kind: 'post'; key: string; timestamp: number; post: FeedPost }
  | { kind: 'goods'; key: string; timestamp: number; listing: GoodsListing };

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
}: Props) {
  const [genre, setGenre] = useState<string>('all');
  const [filter, setFilter] = useState<string>('all');

  // Genres present among the user's subscriptions, in the order they first
  // appear (subscribed is popularity-ordered already).
  const genres = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const c of subscribed) {
      if (!seen.has(c.series)) {
        seen.add(c.series);
        list.push(c.series);
      }
    }
    return list;
  }, [subscribed]);

  const seriesById = useMemo(
    () => new Map(subscribed.map((c) => [c.id, c.series])),
    [subscribed],
  );

  // Characters shown in the rail: narrowed to the selected genre, if any.
  const railCharacters = useMemo(
    () => (genre === 'all' ? subscribed : subscribed.filter((c) => c.series === genre)),
    [subscribed, genre],
  );

  const visiblePosts = useMemo(() => {
    let result = posts;
    if (genre !== 'all') {
      result = result.filter((p) =>
        p.matches?.some((m) => seriesById.get(m.characterId) === genre),
      );
    }
    if (filter !== 'all') {
      result = result.filter((p) => p.matches?.some((m) => m.characterId === filter));
    }
    return result;
  }, [posts, genre, filter, seriesById]);

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
    const goodsEntries: FeedEntry[] = selectedGoods.map((listing) => ({
      kind: 'goods',
      key: `goods:${listing.id}`,
      timestamp: listing.timestamp,
      listing,
    }));
    return [...postEntries, ...goodsEntries].sort((a, b) => b.timestamp - a.timestamp);
  }, [visiblePosts, selectedGoods]);

  const subscribedIds = useMemo(() => subscribed.map((c) => c.id), [subscribed]);

  useEffect(() => {
    if (genre !== 'all' && !genres.includes(genre)) setGenre('all');
  }, [genre, genres]);

  useEffect(() => {
    if (filter !== 'all' && !railCharacters.some((c) => c.id === filter)) setFilter('all');
  }, [filter, railCharacters]);

  if (subscribed.length === 0) {
    return (
      <EmptyFeed onDiscover={onDiscover} />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Featured real-world event, pulled from the collected posts */}
      <EventBanner features={events} />

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

      {/* Genre filter rail */}
      {genres.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-1 scrollbar-none">
          <FilterPill active={genre === 'all'} onClick={() => setGenre('all')} compact>
            전체 장르
          </FilterPill>
          {genres.map((g) => (
            <FilterPill
              key={g}
              active={genre === g}
              onClick={() => {
                if (genre !== g) trackFeatureUse('filter_genre', { genre: g });
                setGenre((current) => (current === g ? 'all' : g));
              }}
              compact
            >
              {g}
            </FilterPill>
          ))}
        </div>
      )}

      {/* Character filter rail */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 mb-2 scrollbar-none">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
          <span className="grid place-items-center w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white text-xs">
            ✦
          </span>
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
          >
            <CharacterAvatar character={c} size={24} />
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
