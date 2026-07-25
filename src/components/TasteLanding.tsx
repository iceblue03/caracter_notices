import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  trackMascotExpression,
  trackOnboardingComplete,
  trackOnboardingStepBack,
  trackOnboardingStepView,
  trackPreference,
} from '../lib/analytics';
import { GuideMascot } from './GuideMascot';

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
        gradient: character?.gradient ?? ['#c4b5fd', '#7c3aed'],
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
const CHARACTER_AGES = ['10대 미만', '10대', '20대', '30대', '40대', '50대', '60대', '70대 이상', '150대 이상'];

// Traits get the full "속성 카드" treatment — an attribute tile with its own
// emoji and flavour line, since this is the step fans care about most.
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

const TRAIT_EMOJI = new Map(CHARACTER_TRAITS.map((t) => [t.label, t.emoji]));

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

/** What 미쿠 says back when a particular option is switched on. */
const PICK_REPLIES: Record<string, string> = {
  '여성향': '여성향 담당이시군요. 확실하게 챙겨둘게요.',
  '남성향': '남성향도 같이 보시는군요. 메모했어요.',
  '게임': '게임 쪽 소식도 같이 물어다 드릴게요.',
  '보컬로이드': '보컬로이드! 신곡 소식은 절대 놓치지 않을게요.',
  '버츄얼 방송': '버츄얼 방송까지… 챙길 게 많아지겠네요. 좋아요.',
  '웹툰·웹소설': '연재분 올라오면 제일 먼저 알려드릴게요.',
  'BL': 'BL은 「Boys’ Love」의 줄임말로 남자 캐릭터끼리의 로맨스를 뜻해요. 알겠습니다, 아주 확실하게 챙길게요.',
  'GL': 'GL은 「Girls’ Love」의 줄임말로 여자 캐릭터끼리의 로맨스를 뜻해요. 취향이 좋으시네요.',
  'HL': 'HL은 「Hetero Love」의 줄임말로 남녀 캐릭터 간의 로맨스를 뜻해요. 무난하게 챙겨둘게요.',
  '로맨스 선호 X': '관계성은 빼고 캐릭터만. 깔끔해서 좋아요.',
  '쿨·냉정': '무표정 속의 다정함… 그 갭이 좋은 거죠.',
  '다정·힐링': '보고만 있어도 치유되는 타입, 저도 동의해요.',
  '열혈·정의': '뜨거운 사람이 좋으시군요. 저까지 힘이 나네요.',
  '츤데레': '츤데레라니… 흥, 딱히 취향이 좋다고 한 건 아니에요.',
  '악역·광기': '악역 취향이시군요. 위험한 분… 마음에 들어요.',
  '지능캐': '판을 읽는 두뇌파. 대화가 즐거운 타입이죠.',
  '개그캐': '웃겨주는 캐릭터, 인생에 꼭 필요하죠.',
  '미스터리': '정체를 알 수 없는 쪽이라니. 취향이 깊으시네요.',
};

function workReply(title: string, count: number): string {
  if (count >= 8) return `「${title}」까지… 취향의 폭이 어마어마하네요.`;
  if (count >= 4) return `「${title}」 좋아요. 이 정도면 피드가 든든하겠어요.`;
  return `「${title}」… 좋은 선택이에요. 기억해둘게요.`;
}

function baseLine(step: number, picked: number, score: number, rankName: string): string {
  switch (step) {
    case 0:
      return '어서 오세요! 안내를 맡은 미쿠예요. 취향만 알려주시면 흩어진 최애 소식을 전부 물어다 드릴게요.';
    case 1:
      return '어떤 세계에서 노시나요? 여러 개 고르셔도 괜찮아요.';
    case 2:
      return '여기가 제일 중요해요. 최애의 조건, 솔직하게 골라주세요.';
    case 3:
      if (picked === 0) return '마음에 드는 표지를 눌러서 담아주세요. 검색도 돼요.';
      if (picked < 3) return '좋아요. 욕심내서 더 담으셔도 괜찮아요.';
      if (picked < 6) return '취향이 슬슬 보이기 시작하네요.';
      return `벌써 ${picked}개나 담으셨어요. 피드가 꽉 차겠는데요?`;
    default:
      return `덕력 ${score}, 「${rankName}」 등급으로 카드가 나왔어요. 이제 들어가 볼까요?`;
  }
}

export function TasteLanding({ postCounts, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(EMPTY_PROFILE);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  // The guide reacts to a pick for a moment, then settles back to the line for
  // whatever step you're on.
  const [mood, setMood] = useState<'idle' | 'happy'>('idle');
  const [reply, setReply] = useState<string | null>(null);
  const replyTimer = useRef<number | undefined>(undefined);

  const react = useCallback((text?: string, key?: string) => {
    setMood('happy');
    setReply(text ?? null);
    trackMascotExpression('happy', key ?? text, step);
    window.clearTimeout(replyTimer.current);
    // Longer lines (e.g. explaining what BL/GL mean) need more than a flash
    // to actually read — scale the on-screen time with the text length
    // instead of clearing every reply after the same fixed beat.
    const duration = text ? Math.min(6000, Math.max(2400, text.length * 65)) : 2400;
    replyTimer.current = window.setTimeout(() => {
      setMood('idle');
      setReply(null);
    }, duration);
  }, [step]);

  useEffect(() => () => window.clearTimeout(replyTimer.current), []);

  // "어떤 표정인지" / onboarding funnel: every stage the guide shows counts as a
  // step reached, whichever direction the user got there from.
  useEffect(() => {
    trackOnboardingStepView(step, STEPS[step].kicker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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
    const turningOn = !current.includes(value);
    setField(key, turningOn ? [...current, value] : current.filter((item) => item !== value));
    if (turningOn) {
      react(PICK_REPLIES[value], value);
      trackPreference(key, value);
    }
  };

  // "전체 선택" toggle for a multi-select group: fills every option, or clears
  // the group if everything's already selected.
  const toggleAllField = (
    key: 'orientations' | 'contentTypes' | 'relationships' | 'characterGenders' | 'characterAges' | 'characterTraits',
    allOptions: string[],
  ) => {
    const turningOn = profile[key].length < allOptions.length;
    setField(key, turningOn ? allOptions : []);
    if (turningOn) {
      react('전부 골라주셨네요! 하나도 놓치지 않고 챙길게요.', `${key}_select_all`);
      trackPreference(key, '__all__');
    }
  };

  const toggleTitle = (index: number) => {
    const turningOn = !selected.includes(index);
    setSelected((current) =>
      turningOn ? [...current, index] : current.filter((item) => item !== index),
    );
    if (turningOn) {
      react(workReply(ANIME_TITLES[index], selected.length + 1), 'work_pick');
      trackPreference('titles', ANIME_TITLES[index]);
    }
  };

  // This onboarding is experimental, so no step should block progress — users
  // can skip ahead having filled in as little (or as much) as they like.
  const canContinue = true;

  const finish = () => {
    const workIds = selected
      .map((index) => WORK_ID_BY_TITLE.get(ANIME_TITLES[index]))
      .filter((id): id is string => Boolean(id));
    trackOnboardingComplete(score, rank.name, workIds.length);
    onComplete({ workIds, profile });
  };

  const current = STEPS[step];
  const CurrentIcon = current.icon;
  const onSummary = step === STEPS.length - 1;
  const line = reply ?? baseLine(step, selected.length, score, rank.name);

  return (
    <main className="ok-shell relative min-h-screen px-4 py-6 text-slate-900 sm:px-6 sm:py-9">
      <div aria-hidden className="ok-grid pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header: identity, live 덕력 gauge, stage counter on one row. */}
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_10px_24px_-10px_rgba(124,58,237,0.9)] p-2">
              <img src="/logo.png" alt="" className="w-full h-full object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-black tracking-tight text-slate-900">오조사마</span>
              <span className="block text-[10px] font-bold tracking-[0.3em] text-violet-400">お嬢様</span>
            </span>
          </div>

          <PowerGauge score={score} rank={rank} className="order-last w-full sm:order-none sm:w-auto sm:flex-1" />

          <span className="ml-auto shrink-0 rounded-full border border-violet-100 bg-white px-3 py-1.5 text-[11px] font-black tracking-[0.18em] text-violet-500 sm:ml-0">
            STAGE {String(Math.min(step + 1, STEPS.length)).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
          </span>
        </header>

        <StageRail step={step} onJump={(index) => setStep(index)} />

        <div className="grid gap-4 lg:grid-cols-[228px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <Guide line={line} mood={mood} />

          <section className="relative rounded-[1.75rem] border border-violet-100 bg-white p-5 shadow-[0_30px_70px_-48px_rgba(124,58,237,0.75)] sm:p-8">
            <Corner className="left-3 top-3 border-l-2 border-t-2" />
            <Corner className="right-3 top-3 border-r-2 border-t-2" />
            <Corner className="bottom-3 left-3 border-b-2 border-l-2" />
            <Corner className="bottom-3 right-3 border-b-2 border-r-2" />

            <div key={step} className="ok-rise relative">
              <div className="mb-7 flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600">
                  <CurrentIcon size={23} />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[11px] font-black tracking-[0.24em] text-violet-600">
                    {current.kicker}
                    <span className="font-bold tracking-normal text-violet-300">{current.jp}</span>
                  </p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    {current.title}
                  </h1>
                  <p className="mt-2 text-sm text-slate-400">{current.hint}</p>
                </div>
              </div>

              {step === 0 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                      <FieldLabel icon={<MapPin size={13} />} text="거주지역" />
                      <select
                        value={profile.residence}
                        onChange={(event) => {
                          setField('residence', event.target.value);
                          if (event.target.value) trackPreference('residence', event.target.value);
                        }}
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
                        onBlur={(event) => {
                          if (event.target.value) trackPreference('age', event.target.value);
                        }}
                        placeholder="만 나이를 입력해주세요"
                        className="ok-field"
                      />
                    </label>
                  </div>
                  <ChoiceGroup
                    label="성별"
                    options={GENDERS}
                    selected={profile.gender ? [profile.gender] : []}
                    onToggle={(value) => {
                      setField('gender', value);
                      react(undefined, 'gender_pick');
                      trackPreference('gender', value);
                    }}
                  />
                  <ChoiceGroup
                    label="콘텐츠 성향"
                    hint="중복 선택 가능"
                    options={ORIENTATIONS}
                    selected={profile.orientations}
                    onToggle={(value) => toggleField('orientations', value)}
                    onToggleAll={() => toggleAllField('orientations', ORIENTATIONS)}
                  />
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Zap size={13} className="text-violet-400" />
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
                    onToggleAll={() => toggleAllField('contentTypes', CONTENT_TYPES)}
                  />
                  <ChoiceGroup
                    label="선호하는 관계성"
                    hint="중복 선택 가능"
                    options={RELATIONSHIPS}
                    selected={profile.relationships}
                    onToggle={(value) => toggleField('relationships', value)}
                    onToggleAll={() => toggleAllField('relationships', RELATIONSHIPS)}
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
                    onToggleAll={() => toggleAllField('characterGenders', CHARACTER_GENDERS)}
                  />
                  <ChoiceGroup
                    label="선호 캐릭터 나이대"
                    hint="중복 선택 가능"
                    options={CHARACTER_AGES}
                    selected={profile.characterAges}
                    onToggle={(value) => toggleField('characterAges', value)}
                    onToggleAll={() => toggleAllField('characterAges', CHARACTER_AGES)}
                  />
                  <fieldset>
                    <GroupLegend
                      label="선호 캐릭터 분위기·속성"
                      hint="중복 선택 가능"
                      action={
                        <SelectAllToggle
                          allSelected={CHARACTER_TRAITS.every((t) => profile.characterTraits.includes(t.label))}
                          onClick={() => toggleAllField('characterTraits', CHARACTER_TRAITS.map((t) => t.label))}
                        />
                      }
                    />
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
                                ? 'border-violet-400 bg-violet-50 shadow-[0_10px_26px_-16px_rgba(124,58,237,0.9)]'
                                : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/50'
                            }`}
                          >
                            {active && <Flash className="rounded-2xl" />}
                            <span className="block text-2xl transition-transform duration-300 group-hover:scale-110">
                              {emoji}
                            </span>
                            <span className={`mt-1.5 block text-sm font-black ${active ? 'text-violet-800' : 'text-slate-700'}`}>
                              {label}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-tight text-slate-400">{flavor}</span>
                            {active && (
                              <span className="ok-pop absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-violet-600 text-white">
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
                      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-violet-300" size={18} />
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
                    <div className="ok-scroll mt-4 flex max-h-24 flex-wrap gap-2 overflow-y-auto border-b border-slate-100 pb-4">
                      {selected.map((index) => {
                        const title = ANIME_TITLES[index];
                        const art = ART_BY_TITLE.get(title);
                        return (
                          <button
                            key={index}
                            onClick={() => toggleTitle(index)}
                            className="ok-pop inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 py-1 pl-1 pr-2.5 text-xs font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                          >
                            <span
                              className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full text-[11px]"
                              style={{ background: gradientStyle(art?.gradient ?? ['#c4b5fd', '#7c3aed']) }}
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
                    <span className="text-slate-400">전체 {results.length}개 작품</span>
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-600">
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
                    <p className="py-10 text-center text-sm text-slate-400">
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

              <footer className="mt-8 flex items-center gap-3 border-t border-slate-100 pt-5">
                {step > 0 && (
                  <button
                    onClick={() => {
                      trackOnboardingStepBack(step, step - 1);
                      setStep((value) => value - 1);
                    }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <ArrowLeft size={17} /> 이전
                  </button>
                )}
                <button
                  onClick={() => (onSummary ? finish() : setStep((value) => value + 1))}
                  disabled={!canContinue}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 text-sm font-black text-white shadow-[0_14px_30px_-12px_rgba(124,58,237,0.95)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-12px_rgba(124,58,237,1)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {onSummary
                    ? '내 피드 개통하기'
                    : step === LAST_INPUT_STEP
                      ? '오시 카드 발급받기'
                      : '다음 단계'}
                  <ArrowRight size={17} />
                </button>
              </footer>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/** 미쿠 and her speech bubble: beside the form on desktop, above it on mobile. */
function Guide({ line, mood }: { line: string; mood: 'idle' | 'happy' }) {
  return (
    <aside className="flex items-center gap-3 lg:sticky lg:top-6 lg:block">
      {/* Mobile: head-and-shoulders crop. Desktop: full-body standee. */}
      <div className="order-1 h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white lg:hidden">
        <GuideMascot mood={mood} fit="cover" />
      </div>
      <GuideMascot mood={mood} className="order-1 hidden w-44 lg:mx-auto lg:block" />

      <div className="order-2 min-w-0 flex-1 lg:order-none lg:mt-1">
        <div
          key={line}
          className="ok-bubble relative rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-[0_14px_30px_-22px_rgba(124,58,237,0.9)]"
        >
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] text-violet-500">
            <Sparkles size={11} /> 미쿠
          </span>
          <p className="text-[13px] font-semibold leading-relaxed text-slate-600">{line}</p>

          {/* Tail points at the mascot: left on mobile, up on desktop. */}
          <span className="absolute -left-1.5 top-8 h-3 w-3 rotate-45 border-b border-l border-violet-100 bg-white lg:hidden" />
          <span className="absolute -top-1.5 left-1/2 hidden h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-violet-100 bg-white lg:block" />
        </div>
      </div>
    </aside>
  );
}

/** One-shot ripple that plays the moment an option turns on. */
function Flash({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden className={`ok-flash pointer-events-none absolute inset-0 bg-violet-400/25 ${className}`} />
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
    <div className={`rounded-xl border border-violet-100 bg-white px-3.5 py-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-base leading-none">{rank.emoji}</span>
          <span className="truncate text-[13px] font-black text-slate-800">{rank.name}</span>
          <span className="hidden shrink-0 text-[10px] font-bold tracking-[0.2em] text-violet-300 lg:inline">
            {rank.jp}
          </span>
        </span>
        <span className="shrink-0 text-[11px] font-black tracking-wider text-violet-600">
          덕력 {score}
          <span className="text-slate-300"> / 100</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-violet-100">
        <div
          className="ok-gauge-shine relative h-full overflow-hidden rounded-full bg-gradient-to-r from-violet-400 to-violet-600 transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(score, 3)}%` }}
        />
      </div>
    </div>
  );
}

/** The stage selector: icon nodes wired together, current one lit up. */
function StageRail({ step, onJump }: { step: number; onJump: (index: number) => void }) {
  return (
    <ol className="mb-4 flex items-center gap-1.5 sm:gap-2" aria-label="가입 진행률">
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
                  ? 'border-violet-600 bg-violet-600 text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,1)]'
                  : done
                    ? 'border-violet-200 bg-violet-50 text-violet-600'
                    : 'border-slate-200 bg-white text-slate-300 hover:border-violet-200 hover:text-violet-400'
              }`}
            >
              {done ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
            </button>
            {index < STEPS.length - 1 && (
              <span className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
                <span
                  className={`block h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600 transition-all duration-500 ${
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
      className={`pointer-events-none absolute h-5 w-5 rounded-[3px] border-violet-200 ${className}`}
    />
  );
}

/** One work in the picker: real cover art above, title on a clean white strip. */
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
      className={`group relative overflow-hidden rounded-xl border text-left transition duration-200 ${
        active
          ? 'border-violet-400 bg-violet-50 shadow-[0_12px_28px_-16px_rgba(124,58,237,1)]'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_28px_-18px_rgba(124,58,237,0.8)]'
      }`}
    >
      {active && <Flash className="z-10 rounded-xl" />}

      <span
        className="relative block aspect-[16/10] overflow-hidden"
        style={{ background: gradientStyle(art?.gradient ?? ['#c4b5fd', '#7c3aed']) }}
      >
        {art?.image ? (
          <img
            src={art.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-3xl opacity-60">{art?.emoji}</span>
        )}

        {postCount > 0 && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-white/85 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 backdrop-blur">
            소식 {postCount}
          </span>
        )}
        {active && (
          <span className="ok-pop absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-violet-600 text-white shadow">
            <Check size={14} strokeWidth={3.5} />
          </span>
        )}
      </span>

      <span
        className={`flex h-9 items-center px-2 text-[12px] font-bold leading-tight ${
          active ? 'text-violet-800' : 'text-slate-700'
        }`}
      >
        <span className="line-clamp-2">{title}</span>
      </span>
    </button>
  );
}

/** The payoff: a pass summarising everything just picked. */
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
      <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-white">
        <div className="relative overflow-hidden px-5 py-5 text-white">
          {cover?.image && (
            <img src={cover.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {/* Tinted left-to-right so the rank column stays readable while the
              cover art still shows through on the right. */}
          <span className="absolute inset-0 bg-gradient-to-r from-violet-700 via-violet-600/90 to-violet-500/35" />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black tracking-[0.22em] backdrop-blur">
                <Ticket size={12} /> OSHI PASS
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/70">推し登録証</span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-3xl leading-none">{rank.emoji}</p>
                <p className="mt-2 text-2xl font-black tracking-tight">{rank.name}</p>
                <p className="text-[11px] font-bold tracking-[0.2em] text-white/70">{rank.jp}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-black tracking-[0.2em] text-white/70">덕력</p>
                <p className="text-3xl font-black leading-none">{score}</p>
              </div>
            </div>

            {identity.length > 0 && (
              <p className="mt-3 text-xs font-bold text-white/85">{identity.join(' · ')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2.5 text-[11px] font-black tracking-[0.2em] text-violet-500">등록 작품 {titles.length}</p>
          {titles.length === 0 ? (
            <p className="text-xs text-slate-400">
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
                    style={{ background: gradientStyle(art?.gradient ?? ['#c4b5fd', '#7c3aed']) }}
                  >
                    {art?.image ? (
                      <img src={art.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-lg opacity-70">{art?.emoji}</span>
                    )}
                    <span className="relative w-full bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3 text-[10px] font-bold leading-tight text-white line-clamp-2">
                      {title}
                    </span>
                  </span>
                );
              })}
              {titles.length > 6 && (
                <span className="grid aspect-[16/10] place-items-center rounded-lg border border-violet-100 bg-violet-50 text-xs font-black text-violet-600">
                  +{titles.length - 6}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2.5 text-[11px] font-black tracking-[0.2em] text-violet-500">취향 태그 {tags.length}</p>
          {tags.length === 0 ? (
            <p className="text-xs text-slate-400">고른 취향이 없어도 괜찮아요. 피드에서 천천히 채워가요.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700"
                >
                  {EMOJI[tag] ?? TRAIT_EMOJI.get(tag)}
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
    <span className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
      {icon} {text}
    </span>
  );
}

function GroupLegend({
  label,
  hint,
  action,
}: {
  label: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <legend className="mb-3 flex w-full items-center justify-between gap-3 text-sm font-bold text-slate-700">
      <span>
        {label} {hint && <span className="ml-1 text-xs font-medium text-violet-400">· {hint}</span>}
      </span>
      {action}
    </legend>
  );
}

/** "전체 선택" / "전체 해제" toggle, shown next to a multi-select group's label. */
function SelectAllToggle({ allSelected, onClick }: { allSelected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-600 transition hover:border-violet-300 hover:bg-violet-100"
    >
      {allSelected ? '전체 해제' : '전체 선택'}
    </button>
  );
}

function ChoiceGroup({
  label,
  hint,
  options,
  selected,
  onToggle,
  onToggleAll,
}: {
  label: string;
  hint?: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  /** Omit for single-select groups (e.g. 성별) — "select all" only makes sense for multi-select. */
  onToggleAll?: () => void;
}) {
  const allSelected = options.length > 0 && options.every((option) => selected.includes(option));
  return (
    <fieldset>
      <GroupLegend
        label={label}
        hint={hint}
        action={onToggleAll && <SelectAllToggle allSelected={allSelected} onClick={onToggleAll} />}
      />
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const active = selected.includes(option);
          const emoji = EMOJI[option];
          return (
            <button
              type="button"
              key={option}
              onClick={() => onToggle(option)}
              className={`relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-xl border px-4 py-2 text-sm font-bold transition ${
                active
                  ? 'border-violet-400 bg-violet-50 text-violet-800 shadow-[0_8px_20px_-14px_rgba(124,58,237,1)]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50/60 hover:text-violet-700'
              }`}
            >
              {active && <Flash className="rounded-xl" />}
              <span
                className={`relative grid h-4 w-4 shrink-0 place-items-center rounded-full border transition ${
                  active ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300'
                }`}
              >
                {active && <Check size={11} strokeWidth={3.5} />}
              </span>
              {emoji && <span className="relative text-base leading-none">{emoji}</span>}
              <span className="relative">{option}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
