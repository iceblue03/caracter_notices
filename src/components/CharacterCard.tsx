import { Check, Plus } from 'lucide-react';
import { Character } from '../types';
import { gradientStyle } from '../lib/utils';
import { CharacterAvatar } from './CharacterAvatar';

interface Props {
  character: Character;
  subscribed: boolean;
  postCount?: number;
  onToggle: () => void;
  onOpen: () => void;
}

export function CharacterCard({ character, subscribed, postCount, onToggle, onOpen }: Props) {
  return (
    <div className="group relative bg-white border border-slate-200/80 rounded-2xl hover:shadow-lg hover:shadow-slate-200/60 transition-shadow">
      {/* Banner */}
      <button
        onClick={onOpen}
        className="block w-full h-20 relative overflow-hidden rounded-t-2xl"
        style={
          character.backgroundImage
            ? {
                backgroundImage: `url(${character.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : { background: gradientStyle(character.gradient) }
        }
        aria-label={`${character.name} 상세 보기`}
      >
        {character.backgroundImage ? (
          <span className="absolute inset-0 bg-black/15" />
        ) : (
          <span className="absolute inset-0 opacity-20 text-white text-5xl grid place-items-center select-none">
            {character.emoji}
          </span>
        )}
      </button>

      <div className="relative z-10 px-4 pb-4 -mt-8">
        <button className="relative z-10" onClick={onOpen} aria-label={`${character.name} 상세 보기`}>
          <CharacterAvatar character={character} size={56} ring />
        </button>

        <div className="mt-2.5 flex items-start justify-between gap-2">
          <button onClick={onOpen} className="text-left min-w-0">
            <h3 className="font-bold text-slate-900 leading-tight truncate">{character.name}</h3>
            <p className="text-xs text-slate-400 truncate">{character.series}</p>
          </button>
          {postCount !== undefined && postCount > 0 && (
            <span className="shrink-0 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
              소식 {postCount}
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2 h-8">
          {character.tagline}
        </p>

        <button
          onClick={onToggle}
          className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-colors ${
            subscribed
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'text-white hover:opacity-90'
          }`}
          style={subscribed ? undefined : { backgroundColor: character.color }}
        >
          {subscribed ? (
            <>
              <Check size={16} /> 구독중
            </>
          ) : (
            <>
              <Plus size={16} /> 구독하기
            </>
          )}
        </button>
      </div>
    </div>
  );
}
