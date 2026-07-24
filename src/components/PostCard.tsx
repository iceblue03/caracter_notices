import { useState } from 'react';
import { Instagram, Twitter, ExternalLink, Languages, Loader2 } from 'lucide-react';
import { Character, FeedPost } from '../types';
import { CHARACTER_MAP } from '../characters';
import { colorFromString, imageSrc, relativeTime, stripLinks } from '../lib/utils';
import { translatePost } from '../lib/api';
import { CharacterChip } from './CharacterChip';

interface Props {
  post: FeedPost;
  /** Character IDs the user cares about — used to order the chips. */
  highlightIds: string[];
  onSelectCharacter: (id: string) => void;
}

/** Author avatar that gracefully falls back to a colored initial on load error. */
function AuthorAvatar({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(!src);
  const initial = [...name.replace(/^@/, '')][0]?.toUpperCase() ?? '?';
  return (
    <div
      className="w-10 h-10 rounded-full grid place-items-center overflow-hidden shrink-0 text-white font-bold text-sm"
      style={{ background: colorFromString(name) }}
    >
      {!failed && src ? (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </div>
  );
}

export function PostCard({ post, highlightIds, onSelectCharacter }: Props) {
  const [translation, setTranslation] = useState<string | null>(null);
  const [translateState, setTranslateState] = useState<'idle' | 'loading' | 'unavailable'>('idle');
  const [imageFailed, setImageFailed] = useState(false);

  // Characters this post matched, subscribed ones first.
  const matchedChars: Character[] = (post.matches ?? [])
    .map((m) => CHARACTER_MAP[m.characterId])
    .filter(Boolean)
    .sort((a, b) => {
      const aH = highlightIds.includes(a.id) ? 0 : 1;
      const bH = highlightIds.includes(b.id) ? 0 : 1;
      return aH - bH;
    });

  const handleTranslate = async () => {
    setTranslateState('loading');
    const res = await translatePost(post.content);
    if (res.translated) {
      setTranslation(res.translated);
      setTranslateState('idle');
    } else {
      setTranslateState('unavailable');
    }
  };

  const avatar = imageSrc(post.avatarUrl);
  const content = stripLinks(post.content);

  return (
    <article className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow">
      <div className="p-5">
        {/* Author row */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
            <AuthorAvatar src={avatar} name={post.author || post.handle} />
            <div>
              <h3 className="font-bold text-slate-900 leading-tight text-[15px]">{post.author}</h3>
              <span className="text-sm text-slate-400">{post.handle}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1.5">
              {post.source === 'live' && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  LIVE
                </span>
              )}
              {post.platform === 'twitter' ? (
                <Twitter size={17} className="text-sky-500" />
              ) : (
                <Instagram size={17} className="text-pink-600" />
              )}
            </span>
            <span className="text-xs text-slate-400 font-medium">{relativeTime(post.timestamp)}</span>
          </div>
        </div>

        {/* Matched character chips */}
        {matchedChars.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {matchedChars.map((c) => (
              <CharacterChip
                key={c.id}
                character={c}
                size="sm"
                onClick={() => onSelectCharacter(c.id)}
              />
            ))}
          </div>
        )}

        {/* Body (raw links stripped — "원본 보기" below covers those) */}
        {content && (
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-[15px]">
            {content}
          </p>
        )}

        {/* Translation */}
        {translation && (
          <div className="mt-3 flex gap-2 items-start bg-sky-50 border border-sky-100 rounded-xl px-3 py-2.5">
            <Languages size={15} className="text-sky-500 mt-0.5 shrink-0" />
            <p className="text-sm text-sky-900 leading-relaxed">{translation}</p>
          </div>
        )}
      </div>

      {/* Image */}
      {post.imageUrl && !imageFailed && (
        <div className="border-t border-slate-100 bg-slate-50">
          <img
            src={imageSrc(post.imageUrl)}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="w-full max-h-80 object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          {translateState === 'unavailable' ? (
            <span className="text-xs text-slate-400">번역을 사용할 수 없어요</span>
          ) : (
            <button
              onClick={handleTranslate}
              disabled={translateState === 'loading' || !!translation}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 disabled:text-slate-300 transition-colors"
            >
              {translateState === 'loading' ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Languages size={15} />
              )}
              {translation ? '번역 완료' : '번역'}
            </button>
          )}
        </div>
        <a
          href={post.link}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          원본 보기 <ExternalLink size={14} />
        </a>
      </div>
    </article>
  );
}
