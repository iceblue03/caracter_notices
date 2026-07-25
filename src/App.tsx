import { useCallback, useEffect, useMemo, useState } from 'react';
import { Home, Compass, ShoppingBag, BarChart3 } from 'lucide-react';
import { CHARACTERS, getCharacter } from './characters';
import { SAMPLE_POSTS, SAMPLE_GOODS } from './data';
import { resolveFeaturedEvents } from './events';
import { annotatePost, annotateGoods } from './lib/matching';
import { syncLiveFeed, syncGoods } from './lib/api';
import { PageViewMethod, trackBack, trackPageView, trackSubscribe } from './lib/analytics';
import { Character, FeedPost, GoodsListing } from './types';
import { useSubscriptions } from './hooks/useSubscriptions';
import { Sidebar } from './components/Sidebar';
import { FeedView } from './components/FeedView';
import { GoodsView } from './components/GoodsView';
import { DiscoverView } from './components/DiscoverView';
import { CharacterDetailView } from './components/CharacterDetailView';
import { TasteLanding } from './components/TasteLanding';
import { StatsView } from './components/StatsView';

type View =
  | { name: 'feed' }
  | { name: 'discover'; query?: string }
  | { name: 'goods'; characterId?: string }
  | { name: 'character'; id: string }
  | { name: 'stats' };

const ADMIN_FLAG_KEY = 'ojosama.admin';

/** The stats dashboard is internal (it shows other testers' aggregate behavior), so
 *  its nav entry stays hidden unless this device was explicitly opted in — either
 *  previously, or via a one-time `?stats=1` link that latches the flag on. */
function useStatsEnabled(): boolean {
  const [enabled] = useState(() => {
    try {
      if (new URLSearchParams(window.location.search).has('stats')) {
        localStorage.setItem(ADMIN_FLAG_KEY, 'true');
        return true;
      }
      return localStorage.getItem(ADMIN_FLAG_KEY) === 'true';
    } catch {
      return false;
    }
  });
  return enabled;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

export default function App() {
  const { ids, isSubscribed, toggle, replace } = useSubscriptions();
  const statsEnabled = useStatsEnabled();
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('ojosama.onboarded') === 'true');
  const [preferenceIds, setPreferenceIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ojosama.preferences') ?? '[]');
    } catch {
      return [];
    }
  });
  const [view, setView] = useState<View>({ name: 'feed' });
  const [livePosts, setLivePosts] = useState<FeedPost[]>([]);
  const [live, setLive] = useState(false);
  const [syncNote, setSyncNote] = useState<string | undefined>();
  const [goodsListings, setGoodsListings] = useState<GoodsListing[]>([]);
  const [goodsLive, setGoodsLive] = useState(false);
  const [goodsSyncing, setGoodsSyncing] = useState(false);
  const [goodsSyncNote, setGoodsSyncNote] = useState<string | undefined>();

  const subscribedCharacters = useMemo(
    () => ids.map(getCharacter).filter((c): c is Character => Boolean(c)),
    [ids],
  );

  // Every known post, annotated with all characters it mentions.
  const annotatedPosts = useMemo(() => {
    const all = dedupeById([...livePosts, ...SAMPLE_POSTS]);
    return all
      .map((p) => annotatePost(p, CHARACTERS))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [livePosts]);

  // Posts relevant to at least one subscribed character.
  const feedPosts = useMemo(() => {
    const subs = new Set(ids);
    return annotatedPosts.filter((p) => p.matches?.some((m) => subs.has(m.characterId)));
  }, [annotatedPosts, ids]);

  // Real events announced in the collected posts — the home feed banner. Runs
  // off every known post, not just the subscribed ones: an event is worth
  // surfacing even when its announcement didn't match a subscription.
  const featuredEvents = useMemo(() => resolveFeaturedEvents(annotatedPosts), [annotatedPosts]);

  // How many known posts mention each character (for Discover badges).
  const postCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of annotatedPosts) {
      for (const m of p.matches ?? []) counts[m.characterId] = (counts[m.characterId] ?? 0) + 1;
    }
    return counts;
  }, [annotatedPosts]);

  // Every known goods listing (live + bundled snapshot), annotated with the
  // characters it's about — same merge shape as annotatedPosts.
  const annotatedGoods = useMemo(() => {
    const all = dedupeById([...goodsListings, ...SAMPLE_GOODS]);
    return all
      .map((g) => annotateGoods(g, CHARACTERS))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [goodsListings]);

  // Goods grouped by character id, so FeedView/CharacterDetailView can mix in
  // "this character's listings" without re-filtering the whole list each time.
  const goodsByCharacter = useMemo(() => {
    const byId: Record<string, GoodsListing[]> = {};
    for (const g of annotatedGoods) {
      for (const m of g.matches ?? []) {
        if (m.characterId === 'misc') continue;
        (byId[m.characterId] ??= []).push(g);
      }
    }
    return byId;
  }, [annotatedGoods]);

  // Loads whatever's already cached — syncing is stopped, so this never
  // triggers a new scrape (see syncLiveFeed's `force` contract).
  const loadCachedFeed = useCallback(async () => {
    const targets = ids.map(getCharacter).filter((c): c is Character => Boolean(c));
    if (targets.length === 0) return;
    const result = await syncLiveFeed(targets, false);
    if (result.live) {
      setLive(true);
      setSyncNote(undefined);
      setLivePosts((prev) => dedupeById([...result.posts, ...prev]));
    } else if (result.reason === 'no-token') {
      setSyncNote('라이브 SNS 동기화가 아직 설정되지 않아, 샘플 소식을 보여드리고 있어요. (APIFY_API_TOKEN 필요)');
    }
  }, [ids]);

  // Same idea as loadCachedFeed, but for goods — auto-load never scrapes.
  const loadCachedGoods = useCallback(async () => {
    const result = await syncGoods(false);
    if (result.live) {
      setGoodsLive(true);
      setGoodsSyncNote(undefined);
      setGoodsListings(result.listings);
    } else if (result.reason === 'no-token') {
      setGoodsSyncNote('APIFY_API_TOKEN이 설정되지 않아, 아직 굿즈 매물을 가져올 수 없어요.');
    }
  }, []);

  useEffect(() => {
    loadCachedFeed();
    loadCachedGoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fires once per fresh landing on the main app (a reload with onboarding
  // already done, or the moment onboarding just finished) — every other
  // view change is tracked at its own navigation call site below instead.
  useEffect(() => {
    if (onboarded) trackPageView('feed', { method: 'initial' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboarded]);

  // Manual "새로고침" in the Goods tab — the only user-triggered scrape in the
  // app (goods starts with an empty seed, unlike the news feed, so it needs
  // one). Still cost-guarded server-side (FORCE_MIN_MS), so mashing the
  // button can't run away with Apify spend.
  const refreshGoods = useCallback(async () => {
    setGoodsSyncing(true);
    try {
      const result = await syncGoods(true);
      if (result.live) {
        setGoodsLive(true);
        setGoodsSyncNote(undefined);
        setGoodsListings(result.listings);
      } else if (result.reason === 'no-token') {
        setGoodsSyncNote('APIFY_API_TOKEN이 설정되지 않아, 아직 굿즈 매물을 가져올 수 없어요.');
      } else if (result.error) {
        setGoodsSyncNote(`매물을 가져오지 못했어요: ${result.error}`);
      }
    } finally {
      setGoodsSyncing(false);
    }
  }, []);

  const goFeed = useCallback((method: PageViewMethod = 'nav') => {
    trackPageView('feed', { method });
    setView({ name: 'feed' });
  }, []);
  const goDiscover = useCallback((method: PageViewMethod = 'nav', query?: string) => {
    trackPageView('discover', { method });
    setView({ name: 'discover', query });
  }, []);
  const openGoods = useCallback((characterId?: string, method: PageViewMethod = 'nav') => {
    trackPageView('goods', { method, id: characterId });
    setView({ name: 'goods', characterId });
    window.scrollTo({ top: 0 });
  }, []);
  const openCharacter = useCallback((id: string, method: PageViewMethod = 'card') => {
    trackPageView('character', { id, name: getCharacter(id)?.name, method });
    setView({ name: 'character', id });
    window.scrollTo({ top: 0 });
  }, []);
  const goStats = useCallback((method: PageViewMethod = 'nav') => {
    trackPageView('stats', { method });
    setView({ name: 'stats' });
  }, []);

  const trackedToggle = useCallback(
    (id: string) => {
      const character = getCharacter(id);
      const wasSubscribed = isSubscribed(id);
      trackSubscribe(wasSubscribed ? 'unsubscribe' : 'subscribe', character?.kind ?? 'work', id, character?.name ?? id);
      toggle(id);
    },
    [isSubscribed, toggle],
  );

  const activeCharacterId = view.name === 'character' ? view.id : undefined;

  if (!onboarded) {
    return (
      <TasteLanding
        postCounts={postCounts}
        onComplete={({ workIds, profile }) => {
          replace(workIds);
          setPreferenceIds(workIds);
          localStorage.setItem('ojosama.preferences', JSON.stringify(workIds));
          localStorage.setItem('ojosama.profile', JSON.stringify(profile));
          localStorage.setItem('ojosama.onboarded', 'true');
          setOnboarded(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar
        active={view.name}
        activeCharacterId={activeCharacterId}
        subscribed={subscribedCharacters}
        onFeed={() => goFeed('sidebar')}
        onDiscover={() => goDiscover('sidebar')}
        onGoods={() => openGoods(undefined, 'sidebar')}
        onSelectCharacter={(id) => openCharacter(id, 'sidebar')}
        showStats={statsEnabled}
        onStats={() => goStats('sidebar')}
      />

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-20 h-14 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center px-4">
        <button onClick={() => goFeed('sidebar')} className="flex items-center gap-2">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white p-1.5">
            <img src="/logo.png" alt="" className="w-full h-full object-contain" />
          </span>
          <span className="font-extrabold tracking-tight">오조사마</span>
        </button>
      </header>

      <main className="flex-1 min-w-0 pt-14 md:pt-0 pb-20 md:pb-0">
        {view.name === 'feed' && (
          <FeedView
            subscribed={subscribedCharacters}
            posts={feedPosts}
            goodsByCharacter={goodsByCharacter}
            events={featuredEvents}
            live={live}
            syncNote={syncNote}
            onSelectCharacter={(id) => openCharacter(id, 'chip')}
            onDiscover={(query) => goDiscover('discover_cta', query)}
            onOpenGoods={openGoods}
            allCharacters={CHARACTERS}
            allPosts={annotatedPosts}
            allGoods={annotatedGoods}
            isSubscribed={isSubscribed}
            postCounts={postCounts}
            onToggleSubscribe={trackedToggle}
          />
        )}

        {view.name === 'discover' && (
          <DiscoverView
            isSubscribed={isSubscribed}
            postCounts={postCounts}
            onToggle={trackedToggle}
            onOpen={(id) => openCharacter(id, 'card')}
            preferenceIds={preferenceIds}
            initialQuery={view.query}
          />
        )}

        {view.name === 'goods' && (
          <GoodsView
            listings={annotatedGoods}
            live={goodsLive}
            syncing={goodsSyncing}
            syncNote={goodsSyncNote}
            initialCharacterId={view.characterId}
            onRefresh={refreshGoods}
            onSelectCharacter={openCharacter}
          />
        )}

        {view.name === 'character' &&
          (() => {
            const character = getCharacter(view.id);
            if (!character) return <div className="p-10 text-center text-slate-400">캐릭터를 찾을 수 없어요.</div>;
            const posts = annotatedPosts.filter((p) =>
              p.matches?.some((m) => m.characterId === character.id),
            );
            return (
              <CharacterDetailView
                character={character}
                posts={posts}
                goods={goodsByCharacter[character.id] ?? []}
                subscribed={isSubscribed(character.id)}
                subscribedIds={ids}
                onToggle={() => trackedToggle(character.id)}
                onSelectCharacter={(id) => openCharacter(id, 'chip')}
                onOpenGoods={openGoods}
                onBack={() => {
                  trackBack('character', character.id, 'feed');
                  goFeed('back_button');
                }}
              />
            );
          })()}

        {view.name === 'stats' && statsEnabled && <StatsView onBack={() => goFeed('back_button')} />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 h-16 bg-white/95 backdrop-blur border-t border-slate-200 flex items-stretch">
        <MobileTab
          active={view.name === 'feed' || view.name === 'character'}
          icon={<Home size={21} />}
          label="홈"
          onClick={() => goFeed()}
        />
        <MobileTab
          active={view.name === 'discover'}
          icon={<Compass size={21} />}
          label="탐색"
          onClick={() => goDiscover()}
        />
        <MobileTab
          active={view.name === 'goods'}
          icon={<ShoppingBag size={21} />}
          label="굿즈"
          onClick={() => openGoods()}
        />
        {statsEnabled && (
          <MobileTab
            active={view.name === 'stats'}
            icon={<BarChart3 size={21} />}
            label="통계"
            onClick={() => goStats()}
          />
        )}
      </nav>
    </div>
  );
}

function MobileTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
        active ? 'text-violet-600' : 'text-slate-400'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
