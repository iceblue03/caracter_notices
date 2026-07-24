import { ArrowLeft, Check, Plus, Inbox } from 'lucide-react';
import { Character, FeedPost } from '../types';
import { gradientStyle, relativeTime } from '../lib/utils';
import { CharacterAvatar } from './CharacterAvatar';
import { PostCard } from './PostCard';

interface Props {
  character: Character;
  posts: FeedPost[]; // posts about this character, newest-first
  subscribed: boolean;
  subscribedIds: string[];
  onToggle: () => void;
  onSelectCharacter: (id: string) => void;
  onBack: () => void;
}

export function CharacterDetailView({
  character,
  posts,
  subscribed,
  subscribedIds,
  onToggle,
  onSelectCharacter,
  onBack,
}: Props) {
  const latest = posts[0];

  return (
    <div className="pb-10">
      {/* Hero */}
      <div className="relative z-0 h-40 sm:h-52" style={{ background: gradientStyle(character.gradient) }}>
        <span className="absolute inset-0 grid place-items-center text-[10rem] opacity-15 text-white select-none">
          {character.emoji}
        </span>
        <button
          onClick={onBack}
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-white/90 hover:text-white bg-black/15 hover:bg-black/25 backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> 뒤로
        </button>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
        {/* Avatar + subscribe overlap the banner; identity flows below it. */}
        <div className="-mt-12 flex items-end justify-between gap-3">
          <CharacterAvatar character={character} size={92} ring />
          <button
            onClick={onToggle}
            className={`mb-1 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              subscribed
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'text-white hover:opacity-90'
            }`}
            style={subscribed ? undefined : { backgroundColor: character.color }}
          >
            {subscribed ? (
              <>
                <Check size={17} /> 구독중
              </>
            ) : (
              <>
                <Plus size={17} /> 구독하기
              </>
            )}
          </button>
        </div>

        <div className="mt-3">
          <span
            className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5"
            style={{ color: character.color, backgroundColor: `${character.color}1a` }}
          >
            {character.series}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {character.name}
          </h1>
          <p className="text-sm text-slate-400">
            {character.nameEn} · {character.role}
          </p>
        </div>

        <p className="mt-3 text-slate-600 leading-relaxed">{character.tagline}</p>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <Stat label="소식" value={`${posts.length}건`} />
          <Stat label="최근 활동" value={latest ? relativeTime(latest.timestamp) : '—'} />
        </div>

        {/* Tags */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {character.hashtags.slice(0, 6).map((h) => (
            <span key={h} className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
              #{h}
            </span>
          ))}
        </div>

        <hr className="my-6 border-slate-200" />

        <h2 className="text-lg font-bold text-slate-800 mb-4">{character.name}의 소식</h2>

        {posts.length === 0 ? (
          <div className="text-center py-14 text-slate-400">
            <Inbox size={30} className="mx-auto mb-3 opacity-60" />
            <p className="font-medium text-slate-500">아직 수집된 소식이 없어요</p>
            <p className="text-sm mt-1">홈 피드에서 ‘새 소식’을 눌러 SNS를 동기화해 보세요.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block font-bold text-slate-800 leading-none">{value}</span>
      <span className="block text-xs text-slate-400 mt-0.5">{label}</span>
    </div>
  );
}
