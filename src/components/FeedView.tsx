import { useEffect, useMemo, useState } from 'react';
import { Compass, CircleOff, Inbox } from 'lucide-react';
import { Character, FeedPost } from '../types';
import { EventFeature } from '../events';
import { EventBanner } from './EventBanner';
import { PostCard } from './PostCard';
import { CharacterAvatar } from './CharacterAvatar';

interface Props {
  subscribed: Character[];
  posts: FeedPost[]; // already filtered to subscriptions, annotated, newest-first
  /** Real events announced in the collected posts, soonest-first. */
  events: EventFeature[];
  live: boolean;
  syncNote?: string;
  onSelectCharacter: (id: string) => void;
  onDiscover: () => void;
}

export function FeedView({
  subscribed,
  posts,
  events,
  live,
  syncNote,
  onSelectCharacter,
  onDiscover,
}: Props) {
  const [filter, setFilter] = useState<string>('all');

  const visiblePosts = useMemo(() => {
    if (filter === 'all') return posts;
    return posts.filter((p) => p.matches?.some((m) => m.characterId === filter));
  }, [posts, filter]);

  const subscribedIds = useMemo(() => subscribed.map((c) => c.id), [subscribed]);

  useEffect(() => {
    if (filter !== 'all' && !subscribedIds.includes(filter)) setFilter('all');
  }, [filter, subscribedIds]);

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

      {/* Character filter rail */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 mb-2 scrollbar-none">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
          <span className="grid place-items-center w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white text-xs">
            ✦
          </span>
          전체
        </FilterPill>
        {subscribed.map((c) => (
          <FilterPill
            key={c.id}
            active={filter === c.id}
            onClick={() => setFilter((current) => (current === c.id ? 'all' : c.id))}
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

      {/* Posts */}
      {visiblePosts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Inbox size={32} className="mx-auto mb-3 opacity-60" />
          <p className="font-medium text-slate-500">아직 이 캐릭터의 새 소식이 없어요</p>
          <p className="text-sm mt-1">‘새 소식’을 눌러 SNS에서 최신 게시물을 불러와 보세요.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              highlightIds={subscribedIds}
              onSelectCharacter={onSelectCharacter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
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
      className={`shrink-0 inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-sm font-semibold border transition-colors ${
        active
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
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
