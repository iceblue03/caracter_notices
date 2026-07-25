import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, RefreshCw, Inbox } from 'lucide-react';
import { GoodsListing, GoodsPlatform } from '../types';
import { CHARACTERS } from '../characters';
import { CharacterAvatar } from './CharacterAvatar';
import { GoodsCard } from './GoodsCard';
import { FilterPill } from './FilterPill';

interface Props {
  listings: GoodsListing[]; // annotated, newest-first
  live: boolean;
  syncing: boolean;
  syncNote?: string;
  /** Pre-selects a character filter (e.g. arriving here via "이 캐릭터 굿즈 매물 더보기"). */
  initialCharacterId?: string;
  onRefresh: () => void;
  onSelectCharacter: (id: string) => void;
}

type SortMode = 'new' | 'price';
type PlatformFilter = 'all' | GoodsPlatform;

export function GoodsView({
  listings,
  live,
  syncing,
  syncNote,
  initialCharacterId,
  onRefresh,
  onSelectCharacter,
}: Props) {
  const [filter, setFilter] = useState<string>(initialCharacterId ?? 'all');
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [sort, setSort] = useState<SortMode>('new');

  // A parent-driven "open goods for character X" should win even if the tab
  // was already open with a different filter selected.
  useEffect(() => {
    if (initialCharacterId) setFilter(initialCharacterId);
  }, [initialCharacterId]);

  // Only characters that actually have a matched listing show in the rail.
  const availableCharacters = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const listing of listings) {
      for (const m of listing.matches ?? []) counts[m.characterId] = (counts[m.characterId] ?? 0) + 1;
    }
    return CHARACTERS.filter((c) => c.id !== 'misc' && counts[c.id] > 0).sort(
      (a, b) => b.popularity - a.popularity,
    );
  }, [listings]);

  useEffect(() => {
    if (filter !== 'all' && !availableCharacters.some((c) => c.id === filter)) setFilter('all');
  }, [filter, availableCharacters]);

  const visible = useMemo(() => {
    let result = listings;
    if (filter !== 'all') {
      result = result.filter((l) => l.matches?.some((m) => m.characterId === filter));
    }
    if (platform !== 'all') {
      result = result.filter((l) => l.platform === platform);
    }
    if (sort === 'price') {
      result = [...result].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    }
    return result;
  }, [listings, filter, platform, sort]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">굿즈</h1>
          <p className="text-sm text-slate-500 mt-1">당근마켓 · 번개장터에서 모은 캐릭터 굿즈 매물</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={syncing}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
          {syncing ? '가져오는 중…' : '새로고침'}
        </button>
      </div>

      {syncNote && (
        <div className="mb-4 text-xs text-slate-400 bg-slate-100/70 rounded-lg px-3 py-2">{syncNote}</div>
      )}

      {/* Character filter rail */}
      {availableCharacters.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-2 scrollbar-none">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
            <span className="grid place-items-center w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white text-xs">
              ✦
            </span>
            전체
          </FilterPill>
          {availableCharacters.map((c) => (
            <FilterPill
              key={c.id}
              active={filter === c.id}
              onClick={() => setFilter((cur) => (cur === c.id ? 'all' : c.id))}
            >
              <CharacterAvatar character={c} size={24} />
              {c.name}
            </FilterPill>
          ))}
        </div>
      )}

      {/* Platform filter + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2">
          <FilterPill compact active={platform === 'all'} onClick={() => setPlatform('all')}>
            전체 플랫폼
          </FilterPill>
          <FilterPill compact active={platform === 'bunjang'} onClick={() => setPlatform('bunjang')}>
            번개장터
          </FilterPill>
          <FilterPill compact active={platform === 'danggeun'} onClick={() => setPlatform('danggeun')}>
            당근마켓
          </FilterPill>
        </div>
        <div className="flex gap-1 text-xs font-semibold">
          <SortButton active={sort === 'new'} onClick={() => setSort('new')}>
            최신순
          </SortButton>
          <SortButton active={sort === 'price'} onClick={() => setSort('price')}>
            낮은 가격순
          </SortButton>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyGoods live={live} syncing={syncing} onRefresh={onRefresh} filtered={filter !== 'all' || platform !== 'all'} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((listing) => (
            <GoodsCard key={listing.id} listing={listing} onSelectCharacter={onSelectCharacter} />
          ))}
        </div>
      )}
    </div>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full transition-colors ${
        active ? 'text-violet-700 bg-violet-50' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyGoods({
  live,
  syncing,
  onRefresh,
  filtered,
}: {
  live: boolean;
  syncing: boolean;
  onRefresh: () => void;
  filtered: boolean;
}) {
  if (filtered) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Inbox size={32} className="mx-auto mb-3 opacity-60" />
        <p className="font-medium text-slate-500">조건에 맞는 매물이 아직 없어요</p>
        <p className="text-sm mt-1">다른 캐릭터나 플랫폼으로 바꿔보세요.</p>
      </div>
    );
  }
  return (
    <div className="text-center py-16 text-slate-400">
      <Inbox size={32} className="mx-auto mb-3 opacity-60" />
      <p className="font-medium text-slate-500">아직 수집된 굿즈 매물이 없어요</p>
      <p className="text-sm mt-1">
        {live
          ? '‘새로고침’을 눌러 당근마켓 · 번개장터에서 매물을 가져와 보세요.'
          : 'APIFY_API_TOKEN이 설정되면 당근마켓 · 번개장터 매물을 가져올 수 있어요.'}
      </p>
      <button
        onClick={onRefresh}
        disabled={syncing}
        className="mt-5 inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        <ShoppingBag size={17} /> {syncing ? '가져오는 중…' : '매물 가져오기'}
      </button>
    </div>
  );
}
