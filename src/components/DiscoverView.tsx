import { useMemo, useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { Character } from '../types';
import { CHARACTERS, getSeriesList } from '../characters';
import { CharacterCard } from './CharacterCard';

interface Props {
  isSubscribed: (id: string) => boolean;
  postCounts: Record<string, number>;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  preferenceIds: string[];
}

export function DiscoverView({ isSubscribed, postCounts, onToggle, onOpen, preferenceIds }: Props) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    return CHARACTERS.filter((c) =>
      [c.name, c.nameEn, c.series, c.seriesEn, c.role].some((f) =>
        f.toLowerCase().includes(q),
      ),
    );
  }, [q]);

  const trending = useMemo(
    () => [...CHARACTERS].sort((a, b) => b.popularity - a.popularity).slice(0, 6),
    [],
  );
  const recommended = useMemo(() => {
    if (preferenceIds.length === 0) return trending;
    const selectedIndexes = preferenceIds
      .map((id) => CHARACTERS.findIndex((character) => character.id === id))
      .filter((index) => index >= 0);
    return [...CHARACTERS]
      .filter((character) => character.id !== 'misc')
      .sort((a, b) => {
        const score = (character: Character) => {
          const index = CHARACTERS.indexOf(character);
          const distance = Math.min(...selectedIndexes.map((selected) => Math.abs(selected - index)));
          return (preferenceIds.includes(character.id) ? 1000 : 0) + Math.max(0, 100 - distance) + character.popularity / 100;
        };
        return score(b) - score(a);
      })
      .slice(0, 6);
  }, [preferenceIds, trending]);
  const seriesList = useMemo(() => getSeriesList(), []);

  const renderCard = (c: Character) => (
    <CharacterCard
      key={c.id}
      character={c}
      subscribed={isSubscribed(c.id)}
      postCount={postCounts[c.id]}
      onToggle={() => onToggle(c.id)}
      onOpen={() => onOpen(c.id)}
    />
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">캐릭터 탐색</h1>
        <p className="text-sm text-slate-500 mt-1">
          최애를 구독하면 그 캐릭터의 SNS 소식이 홈 피드에 모여요.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="캐릭터 · 작품 이름으로 검색 (예: 아냐, 주술회전, Genshin)"
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all"
        />
      </div>

      {matches ? (
        matches.length === 0 ? (
          <p className="text-center text-slate-400 py-16">
            ‘{query}’에 해당하는 캐릭터를 찾지 못했어요.
          </p>
        ) : (
          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
              검색 결과 {matches.length}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{matches.map(renderCard)}</div>
          </section>
        )
      ) : (
        <>
          {/* Taste recommendations */}
          <section className="mb-10">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
              <TrendingUp size={15} className="text-fuchsia-500" /> 내 취향 추천
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{recommended.map(renderCard)}</div>
          </section>

          {/* By series */}
          {seriesList.map(({ series, seriesEn, characters }) => (
            <section key={series} className="mb-10">
              <h2 className="text-sm font-bold text-slate-500 mb-3">
                {series}{' '}
                <span className="text-slate-300 font-medium">· {seriesEn}</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {characters.map(renderCard)}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
