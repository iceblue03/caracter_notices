import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gamepad2,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  Trophy,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { ANIME_TITLES } from '../animeTitles';
import { WORKS, getCharacter } from '../characters';
import { gradientStyle } from '../lib/utils';

// `WORKS` isn't in the same order as `ANIME_TITLES` (curated works were
// entered out of sequence), so titles must be resolved to a work id by
// name — never by matching index into both arrays.
const WORK_ID_BY_TITLE = new Map(WORKS.map((w) => [w.title, w.id]));

interface TitleArt {
  workId?: string;
  image?: string;
  emoji: string;
  gradient: [string, string];
}

// Cover art (plus the deterministic emoji/gradient fallback for works with no
// artwork on disk) already exists per work in the character catalog. Resolve it
// once at module load so the picker can render 298 art tiles without redoing
// this lookup on every keystroke.
const ART_BY_TITLE = new Map<string, TitleArt>(
  ANIME_TITLES.map((title) => {
    const workId = WORK_ID_BY_TITLE.get(title);
    const character = workId ? getCharacter(workId) : undefined;
    return [
      title,
      {
        workId,
        image: character?.backgroundImage,
        emoji: character?.emoji ?? '✨',
        gradient: character?.gradient ?? ['#a78bfa', '#6d28d9'],
      },
    ];
  }),
);

export interface OnboardingProfile {
  residence: string;
  gender: string;
  age: string;
  orientations: string[];
  contentTypes: string[];
  relationships: string[];
  characterGenders: string[];
  characterAges: string[];
  characterTraits: string[];
}

interface Props {
  /** Known post count per work id — used to rank the title picker by activity. */
  postCounts: Record<string, number>;
  onComplete: (result: { workIds: string[]; profile: OnboardingProfile }) => void;
}

const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '해외',
];

/** Option label → emoji. Missing entries just render without one. */
const EMOJI: Record<string, string> = {
  '여성': '🌸', '남성': '🔷', '논바이너리': '🌈', '응답 안 함': '🕶️',
  '여성향': '💗', '남성향': '💙',
  '애니메이션·만화': '📺', '게임': '🎮', '웹툰·웹소설': '📖', '보컬로이드': '🎤', '버츄얼 방송': '🖥️',
  'BL': '💜', 'GL': '💛', 'HL': '❤️', '로맨스 선호 X': '🚫',
  '남자 캐릭터': '🤴', '여자 캐릭터': '👸', '그 외': '✨',
};

const GENDERS = ['여성', '남성', '논바이너리', '응답 안 함'];
const ORIENTATIONS = ['여성향', '남성향'];
const CONTENT_TYPES = ['애니메이션·만화', '게임', '웹툰·웹소설', '보컬로이드', '버츄얼 방송'];
const RELATIONSHIPS = ['BL', 'GL', 'HL', '로맨스 선호 X'];
const CHARACTER_GENDERS = ['남자 캐릭터', '여자 캐릭터', '그 외'];
const CHARACTER_AGES = ['10대 미만', '10대', '20대', '30대', '40대', '50대', '60대', '70대 이상'];

// Traits get the full "속성 카드" treatment — a gacha-style attribute tile with
// its own emoji and flavour line, since this is the step fans care about most.
const CHARACTER_TRAITS: { label: string; emoji: string; flavor: string }[] = [
  { label: '쿨·냉정', emoji: '❄️', flavor: '무표정 속 다정함' },
  { label: '다정·힐링', emoji: '🍮', flavor: '보고만 있어도 치유' },
  { label: '열혈·정의', emoji: '🔥', flavor: '한계를 넘는 근성' },
  { label: '츤데레', emoji: '💢', flavor: '착각하지 마! 그런 거' },
  { label: '악역·광기', emoji: '🃏', flavor: '매혹적인 파멸형' },
  { label: '지능캐', emoji: '🧠', flavor: '판을 읽는 두뇌파' },
  { label: '개그캐', emoji: '🤣', flavor: '분위기 담당 청량제' },
  { label: '미스터리', emoji: '🌙', flavor: '정체를 알 수 없는' },
];

const TRAIT_LABELS = CHARACTER_TRAITS.map((t) => t.label);

const EMPTY_PROFILE: OnboardingProfile = {
  residence: '',
  gender: '',
  age: '',
  orientations: [],
  contentTypes: [],
  relationships: [],
  characterGenders: [],
  characterAges: [],
  characterTraits: [],
};

const STEPS = [
  { kicker: 'PROFILE', jp: 'プロフィール', title: '당신은 어떤 덕후인가요?', icon: UserRound,
    hint: '취향 추천에만 쓰이는 정보예요. 편하게 골라주세요.' },
  { kicker: 'UNIVERSE', jp: '世界観', title: '어떤 세계에 살고 있나요?', icon: Gamepad2,
    hint: '즐기는 장르를 알려주면 피드의 결이 달라져요.' },
  { kicker: 'OSHI TYPE', jp: '推しの好み', title: '최애의 조건을 말해주세요', icon: Heart,
    hint: '취향에 맞는 속성일수록 추천 상단에 올라와요.' },
  { kicker: 'TITLES', jp: '作品選択', title: '최애가 사는 작품을 담아주세요', icon: Sparkles,
    hint: '검색하거나 스크롤해서 마음껏 골라도 좋아요.' },
  { kicker: 'COMPLETE', jp: '登録完了', title: '오시 카드가 발급됐어요', icon: Trophy,
    hint: '이 카드를 기준으로 피드를 채워둘게요.' },
];

const LAST_INPUT_STEP = STEPS.length - 2;

/** 덕력 게이지 등급. `min`은 100점 만점 점수의 하한선. */
const RANKS = [
  { min: 0, name: '신입 덕후', jp: '新人', emoji: '🌱' },
  { min: 25, name: '입덕 완료', jp: '見習い', emoji: '🌸' },
  { min: 45, name: '진성 덕후', jp: '本気', emoji: '🔥' },
  { min: 68, name: '오시 마스터', jp: '推しマスター', emoji: '👑' },
  { min: 88, name: '전설의 덕후', jp: '伝説', emoji: '🌟' },
];

function rankOf(score: number) {
  return [...RANKS].reverse().find((r) => score >= r.min) ?? RANKS[0];
}

export function TasteLanding({ postCounts, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(EMPTY_PROFILE);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  // Most-talked-about titles first, so popular picks surface without searching.
  const countOf = (title: string) => {
    const id = WORK_ID_BY_TITLE.get(title);
    return id ? postCounts[id] ?? 0 : 0;
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ANIME_TITLES.map((title, index) => ({ title, index }))
      .filter(({ title }) => !q || title.toLowerCase().includes(q))
      .sort((a, b) => countOf(b.title) - countOf(a.title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, postCounts]);

  // Fills as the form does — the whole point is that answering feels like
  // levelling up rather than filling in a survey.
  const score = useMemo(() => {
    let total = 0;
    if (profile.residence) total += 6;
    if (profile.age) total += 6;
    if (profile.gender) total += 6;
    total += Math.min(profile.orientations.length, 2) * 4;
    total += Math.min(profile.contentTypes.length, 3) * 5;
    total += Math.min(profile.relationships.length, 2) * 4;
    total += Math.min(profile.characterGenders.length, 2) * 4;
    total += Math.min(profile.characterAges.length, 3) * 3;
    total += Math.min(profile.characterTraits.length, 4) * 3;
    total += Math.min(selected.length, 8) * 3;
    return Math.min(100, total);
  }, [profile, selected]);

  const rank = rankOf(score);

  const setField = <K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const toggleField = (
    key: 'orientations' | 'contentTypes' | 'relationships' | 'characterGenders' | 'characterAges' | 'characterTraits',
    value: string,
  ) => {
    const current = profile[key];
    setField(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const toggleTitle = (index: number) => {
    setSelected((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  };

  // This onboarding is experimental, so no step should block progress — users
  // can skip ahead having filled in as little (or as much) as they like.
  const canContinue = true;

  const finish = () => {
    const workIds = selected
      .map((index) => WORK_ID_BY_TITLE.get(ANIME_TITLES[index]))
      .filter((id): id is string => Boolean(id));
    onComplete({ workIds, profile });
  };

  const current = STEPS[step];
  const CurrentIcon = current.icon;
  const onSummary = step === STEPS.length - 1;

  return (
    <main className="ok-shell relative min-h-screen overflow-hidden px-4 py-6 text-slate-100 sm:px-6 sm:py-9">
      <StageBackdrop />

      <div className="relative mx-auto max-w-5xl">
        {/* Game-HUD header: identity, live 덕력 gauge, stage counter on one row. */}
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="ok-halo grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white">
              <Sparkles size={20} />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-black tracking-tight text-white">오조사마</span>
              <span className="block text-[10px] font-bold tracking-[0.3em] text-violet-300/70">お嬢様</span>
            </span>
          </div>

          <PowerGauge score={score} rank={rank} className="order-last w-full sm:order-none sm:w-auto sm:flex-1" />

          <span className="ml-auto shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black tracking-[0.18em] text-violet-200/80 backdrop-blur sm:ml-0">
            STAGE {String(Math.min(step + 1, STEPS.length)).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
          </span>
        </header>

        <StageRail step={step} onJump={(index) => setStep(index)} />

        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_30px_80px_-40px_rgba(139,92,246,0.9)] backdrop-blur-xl sm:p-8">
          {/* Neon frame + corner brackets, the "anime game menu" cue. */}
          <span className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-violet-400/25 via-transparent to-cyan-400/20 [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] p-px" />
          <Corner className="left-3 top-3 border-l-2 border-t-2" />
          <Corner className="right-3 top-3 border-r-2 border-t-2" />
          <Corner className="bottom-3 left-3 border-b-2 border-l-2" />
          <Corner className="bottom-3 right-3 border-b-2 border-r-2" />

          <div key={step} className="ok-rise relative">
            <div className="mb-7 flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/15 text-violet-200">
                <CurrentIcon size={23} />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[11px] font-black tracking-[0.24em] text-fuchsia-300">
                  {current.kicker}
                  <span className="font-bold tracking-normal text-violet-300/50">{current.jp}</span>
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_18px_rgba(167,139,250,0.45)] sm:text-3xl">
                  {current.title}
                </h1>
                <p className="mt-2 text-sm text-violet-200/50">{current.hint}</p>
              </div>
            </div>

            {step === 0 && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <FieldLabel icon={<MapPin size={13} />} text="거주지역" />
                    <select
                      value={profile.residence}
                      onChange={(event) => setField('residence', event.target.value)}
                      className="ok-field"
                    >
                      <option value="">지역 선택</option>
                      {REGIONS.map((region) => <option key={region}>{region}</option>)}
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <FieldLabel text="나이" />
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={profile.age}
                      onChange={(event) => setField('age', event.target.value)}
                      placeholder="만 나이를 입력해주세요"
                      className="ok-field"
                    />
                  </label>
                </div>
                <ChoiceGroup
                  label="성별"
                  options={GENDERS}
                  selected={profile.gender ? [profile.gender] : []}
                  onToggle={(value) => setField('gender', value)}
                />
                <ChoiceGroup
                  label="콘텐츠 성향"
                  hint="중복 선택 가능"
                  options={ORIENTATIONS}
                  selected={profile.orientations}
                  onToggle={(value) => toggleField('orientations', value)}
                />
                <p className="flex items-center gap-1.5 text-xs text-violet-200/45">
                  <Zap size={13} className="text-violet-300/70" />
                  입력 정보는 이 기기의 개인화 추천 설정에만 저장돼요.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-7">
                <ChoiceGroup
                  label="주로 즐기는 콘텐츠"
                  hint="중복 선택 가능"
                  options={CONTENT_TYPES}
                  selected={profile.contentTypes}
                  onToggle={(value) => toggleField('contentTypes', value)}
                />
                <ChoiceGroup
                  label="선호하는 관계성"
                  hint="중복 선택 가능"
                  options={RELATIONSHIPS}
                  selected={profile.relationships}
                  onToggle={(value) => toggleField('relationships', value)}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-7">
                <ChoiceGroup
                  label="선호 캐릭터"
                  hint="중복 선택 가능"
                  options={CHARACTER_GENDERS}
                  selected={profile.characterGenders}
                  onToggle={(value) => toggleField('characterGenders', value)}
                />
                <ChoiceGroup
                  label="선호 캐릭터 나이대"
                  hint="중복 선택 가능"
                  options={CHARACTER_AGES}
                  selected={profile.characterAges}
                  onToggle={(value) => toggleField('characterAges', value)}
                />
                <fieldset>
                  <GroupLegend label="선호 캐릭터 분위기·속성" hint="중복 선택 가능" />
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {CHARACTER_TRAITS.map(({ label, emoji, flavor }) => {
                      const active = profile.characterTraits.includes(label);
                      return (
                        <button
                          type="button"
                          key={label}
                          onClick={() => toggleField('characterTraits', label)}
                          className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition ${
                            active
                              ? 'border-fuchsia-400/70 bg-gradient-to-br from-fuchsia-500/25 to-violet-500/15 shadow-[0_0_28px_-6px_rgba(232,121,249,0.7)]'
                              : 'border-white/10 bg-white/[0.03] hover:border-violet-400/40 hover:bg-white/[0.07]'
                          }`}
                        >
                          <span className="block text-2xl transition-transform duration-300 group-hover:scale-110">{emoji}</span>
                          <span className={`mt-1.5 block text-sm font-black ${active ? 'text-white' : 'text-slate-200'}`}>
                            {label}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-tight text-violet-200/45">{flavor}</span>
                          {active && (
                            <span className="ok-pop absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-fuchsia-500 text-white">
                              <Check size={12} strokeWidth={3.5} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="relative">
                  {!query && (
                    <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-violet-300/60" size={18} />
                  )}
                  <input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="애니·게임·웹툰·버츄얼 작품 검색"
                    className="ok-field ok-field-search"
                  />
                </div>

                {selected.length > 0 && (
                  <div className="ok-scroll mt-4 flex max-h-24 flex-wrap gap-2 overflow-y-auto border-b border-white/10 pb-4">
                    {selected.map((index) => {
                      const title = ANIME_TITLES[index];
                      const art = ART_BY_TITLE.get(title);
                      return (
                        <button
                          key={index}
                          onClick={() => toggleTitle(index)}
                          className="ok-pop inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 py-1 pl-1 pr-2.5 text-xs font-bold text-fuchsia-100 transition hover:bg-fuchsia-500/30"
                        >
                          <span
                            className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full text-[11px]"
                            style={{ background: gradientStyle(art?.gradient ?? ['#a78bfa', '#6d28d9']) }}
                          >
                            {art?.image ? (
                              <img src={art.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              art?.emoji
                            )}
                          </span>
                          {title}
                          <X size={13} />
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs font-bold">
                  <span className="text-violet-200/50">전체 {results.length}개 작품</span>
                  <span className="rounded-full bg-fuchsia-500/15 px-2.5 py-1 text-fuchsia-200">
                    ⭐ {selected.length}개 담음
                  </span>
                </div>

                {/* Capped so the "발급받기" CTA below stays on screen — the grid
                    scrolls internally instead of pushing the footer off. */}
                <div className="ok-scroll mt-3 grid max-h-[40vh] min-h-56 grid-cols-2 gap-2.5 overflow-y-auto pr-2 sm:grid-cols-3 lg:grid-cols-4">
                  {results.map(({ title, index }) => (
                    <WorkTile
                      key={`${title}-${index}`}
                      title={title}
                      art={ART_BY_TITLE.get(title)}
                      postCount={countOf(title)}
                      active={selected.includes(index)}
                      onToggle={() => toggleTitle(index)}
                    />
                  ))}
                </div>
                {results.length === 0 && (
                  <p className="py-10 text-center text-sm text-violet-200/50">
                    ‘{query}’와 일치하는 작품이 없어요.
                  </p>
                )}
              </div>
            )}

            {onSummary && (
              <OshiPass
                profile={profile}
                rank={rank}
                score={score}
                titles={selected.map((index) => ANIME_TITLES[index])}
              />
            )}

            <footer className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5">
              {step > 0 && (
                <button
                  onClick={() => setStep((value) => value - 1)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-bold text-violet-200 transition hover:border-violet-400/50 hover:bg-white/5"
                >
                  <ArrowLeft size={17} /> 이전
                </button>
              )}
              <button
                onClick={() => (onSummary ? finish() : setStep((value) => value + 1))}
                disabled={!canContinue}
                className="ok-sheen relative inline-flex h-12 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-500 px-5 text-sm font-black text-white shadow-[0_12px_36px_-10px_rgba(217,70,239,0.9)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  {onSummary
                    ? '내 피드 개통하기'
                    : step === LAST_INPUT_STEP
                      ? '오시 카드 발급받기'
                      : '다음 단계'}
                  <ArrowRight size={17} />
                </span>
              </button>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

/** Aurora blobs, a star field, and drifting petals — pure decoration. */
function StageBackdrop() {
  const stars = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: (i * 37.6) % 100,
        top: (i * 61.3) % 100,
        size: 1 + (i % 3),
        delay: (i % 9) * 0.55,
      })),
    [],
  );
  const petals = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        emoji: ['🌸', '✨', '⭐', '🌸', '💫', '🌟'][i % 6],
        left: (i * 8.5 + 3) % 100,
        duration: 16 + (i % 5) * 4,
        delay: i * 1.7,
        size: 12 + (i % 4) * 5,
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="ok-aurora absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-violet-600/35 blur-[110px]" />
      <span
        className="ok-aurora absolute -right-32 -top-24 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/30 blur-[110px]"
        style={{ animationDelay: '-6s' }}
      />
      <span
        className="ok-aurora absolute -bottom-40 left-1/3 h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-[120px]"
        style={{ animationDelay: '-11s' }}
      />

      {stars.map((star, i) => (
        <span
          key={i}
          className="ok-star absolute rounded-full bg-white"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {petals.map((petal, i) => (
        <span
          key={i}
          className="ok-petal absolute top-0 select-none"
          style={{
            left: `${petal.left}%`,
            fontSize: petal.size,
            animationDuration: `${petal.duration}s`,
            animationDelay: `${petal.delay}s`,
          }}
        >
          {petal.emoji}
        </span>
      ))}
    </div>
  );
}

/** 덕력 게이지 — an EXP bar that rewards every answer with visible progress. */
function PowerGauge({
  score,
  rank,
  className = '',
}: {
  score: number;
  rank: (typeof RANKS)[number];
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 backdrop-blur-xl ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-base leading-none">{rank.emoji}</span>
          <span className="truncate text-[13px] font-black text-white">{rank.name}</span>
          <span className="hidden shrink-0 text-[10px] font-bold tracking-[0.2em] text-violet-300/50 lg:inline">
            {rank.jp}
          </span>
        </span>
        <span className="shrink-0 text-[11px] font-black tracking-wider text-fuchsia-300">
          덕력 {score}
          <span className="text-violet-300/40"> / 100</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 shadow-[0_0_14px_rgba(232,121,249,0.8)] transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(score, 3)}%` }}
        />
      </div>
    </div>
  );
}

/** The stage selector: icon nodes wired together, current one lit up. */
function StageRail({ step, onJump }: { step: number; onJump: (index: number) => void }) {
  return (
    <ol className="mb-5 flex items-center gap-1.5 sm:gap-2" aria-label="가입 진행률">
      {STEPS.map(({ kicker, icon: Icon }, index) => {
        const done = index < step;
        const active = index === step;
        return (
          <li key={kicker} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onJump(index)}
              aria-current={active ? 'step' : undefined}
              title={kicker}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${
                active
                  ? 'ok-halo border-fuchsia-400/70 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white'
                  : done
                    ? 'border-violet-400/40 bg-violet-500/20 text-violet-200'
                    : 'border-white/10 bg-white/5 text-slate-500 hover:border-violet-400/40 hover:text-violet-200'
              }`}
            >
              {done ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
            </button>
            {index < STEPS.length - 1 && (
              <span className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                <span
                  className={`block h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-500 ${
                    done ? 'w-full' : 'w-0'
                  }`}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-5 w-5 rounded-[3px] border-violet-400/50 ${className}`}
    />
  );
}

/** One work in the picker: real cover art, or its deterministic gradient. */
function WorkTile({
  title,
  art,
  postCount,
  active,
  onToggle,
}: {
  title: string;
  art?: TitleArt;
  postCount: number;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group relative aspect-[16/10] overflow-hidden rounded-xl border text-left transition ${
        active
          ? 'border-fuchsia-400 shadow-[0_0_26px_-4px_rgba(232,121,249,0.85)]'
          : 'border-white/10 hover:border-violet-400/60'
      }`}
      style={{ background: gradientStyle(art?.gradient ?? ['#a78bfa', '#6d28d9']) }}
    >
      {art?.image ? (
        <img
          src={art.image}
          alt=""
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110 ${
            active ? 'scale-105' : ''
          }`}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-3xl opacity-40 transition group-hover:scale-110">
          {art?.emoji}
        </span>
      )}

      {/* Legibility scrim — darker when idle so selection reads as "lit up". */}
      <span
        className={`absolute inset-0 bg-gradient-to-t transition ${
          active
            ? 'from-fuchsia-950/90 via-fuchsia-900/25 to-transparent'
            : 'from-[#070512]/95 via-[#070512]/45 to-[#070512]/25 group-hover:via-[#070512]/25'
        }`}
      />

      {postCount > 0 && (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-cyan-200 backdrop-blur">
          소식 {postCount}
        </span>
      )}

      {active && (
        <span className="ok-pop absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-fuchsia-500 text-white shadow-lg">
          <Check size={14} strokeWidth={3.5} />
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 p-2">
        <span
          className={`line-clamp-2 block text-[13px] font-black leading-tight drop-shadow ${
            active ? 'text-white' : 'text-slate-100'
          }`}
        >
          {title}
        </span>
      </span>
    </button>
  );
}

/** The payoff: a holographic pass summarising everything just picked. */
function OshiPass({
  profile,
  rank,
  score,
  titles,
}: {
  profile: OnboardingProfile;
  rank: (typeof RANKS)[number];
  score: number;
  titles: string[];
}) {
  const tags = [
    ...profile.orientations,
    ...profile.contentTypes,
    ...profile.relationships,
    ...profile.characterGenders,
    ...profile.characterTraits,
  ];
  const identity = [profile.residence, profile.age && `${profile.age}세`, profile.gender].filter(Boolean);
  const cover = titles.map((title) => ART_BY_TITLE.get(title)).find((art) => art?.image);

  return (
    <div className="ok-rise space-y-4">
      <div className="ok-sheen relative overflow-hidden rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-violet-600/25 via-fuchsia-600/15 to-cyan-500/15 p-5">
        {cover?.image && (
          <>
            <img src={cover.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            {/* Keeps the rank/identity column readable over any artwork. */}
            <span className="absolute inset-0 bg-gradient-to-r from-[#0b0620]/85 via-[#0b0620]/45 to-transparent" />
          </>
        )}
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-black tracking-[0.22em] text-fuchsia-200 backdrop-blur">
              <Ticket size={12} /> OSHI PASS
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-violet-200/60">推し登録証</span>
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-3xl leading-none">{rank.emoji}</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-white">{rank.name}</p>
              <p className="text-[11px] font-bold tracking-[0.2em] text-violet-200/60">{rank.jp}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-black tracking-[0.2em] text-violet-200/50">덕력</p>
              <p className="text-3xl font-black leading-none text-fuchsia-200 drop-shadow-[0_0_18px_rgba(232,121,249,0.7)]">
                {score}
              </p>
            </div>
          </div>

          {identity.length > 0 && (
            <p className="mt-3 text-xs font-bold text-violet-100/70">{identity.join(' · ')}</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2.5 text-[11px] font-black tracking-[0.2em] text-violet-300/70">등록 작품 {titles.length}</p>
          {titles.length === 0 ? (
            <p className="text-xs text-violet-200/50">
              아직 담은 작품이 없어요. 이전 단계에서 최애 작품을 골라보세요.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {titles.slice(0, 6).map((title) => {
                const art = ART_BY_TITLE.get(title);
                return (
                  <span
                    key={title}
                    title={title}
                    className="relative flex aspect-[16/10] items-end overflow-hidden rounded-lg"
                    style={{ background: gradientStyle(art?.gradient ?? ['#a78bfa', '#6d28d9']) }}
                  >
                    {art?.image ? (
                      <img src={art.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-lg opacity-50">{art?.emoji}</span>
                    )}
                    <span className="relative w-full bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-1 pt-3 text-[10px] font-bold leading-tight text-white line-clamp-2">
                      {title}
                    </span>
                  </span>
                );
              })}
              {titles.length > 6 && (
                <span className="grid aspect-[16/10] place-items-center rounded-lg border border-white/10 bg-white/5 text-xs font-black text-violet-200">
                  +{titles.length - 6}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2.5 text-[11px] font-black tracking-[0.2em] text-violet-300/70">취향 태그 {tags.length}</p>
          {tags.length === 0 ? (
            <p className="text-xs text-violet-200/50">고른 취향이 없어도 괜찮아요. 피드에서 천천히 채워가요.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[11px] font-bold text-violet-100"
                >
                  {EMOJI[tag] ?? (TRAIT_LABELS.includes(tag) ? CHARACTER_TRAITS.find((t) => t.label === tag)?.emoji : '')}
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <span className="mb-2 flex items-center gap-1.5 text-sm font-bold text-violet-100">
      {icon} {text}
    </span>
  );
}

function GroupLegend({ label, hint }: { label: string; hint?: string }) {
  return (
    <legend className="mb-3 text-sm font-bold text-violet-100">
      {label} {hint && <span className="ml-1 text-xs font-medium text-fuchsia-300/80">· {hint}</span>}
    </legend>
  );
}

function ChoiceGroup({
  label,
  hint,
  options,
  selected,
  onToggle,
}: {
  label: string;
  hint?: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <GroupLegend label={label} hint={hint} />
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const active = selected.includes(option);
          const emoji = EMOJI[option];
          return (
            <button
              type="button"
              key={option}
              onClick={() => onToggle(option)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${
                active
                  ? 'border-fuchsia-400/70 bg-gradient-to-br from-fuchsia-500/25 to-violet-500/20 text-white shadow-[0_0_22px_-6px_rgba(232,121,249,0.85)]'
                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-violet-400/40 hover:bg-white/[0.07] hover:text-white'
              }`}
            >
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition ${
                  active ? 'border-fuchsia-400 bg-fuchsia-500 text-white' : 'border-white/25'
                }`}
              >
                {active && <Check size={11} strokeWidth={3.5} />}
              </span>
              {emoji && <span className="text-base leading-none">{emoji}</span>}
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
