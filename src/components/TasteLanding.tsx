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
  UserRound,
  X,
} from 'lucide-react';
import { ANIME_TITLES } from '../animeTitles';
import { WORKS } from '../characters';

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
  onComplete: (result: { workIds: string[]; profile: OnboardingProfile }) => void;
}

const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '해외',
];
const GENDERS = ['여성', '남성', '논바이너리', '응답 안 함'];
const ORIENTATIONS = ['여성향', '남성향'];
const CONTENT_TYPES = ['애니메이션·만화', '게임', '웹툰·웹소설', '보컬로이드', '버츄얼 방송'];
const RELATIONSHIPS = ['BL', 'GL', 'HL', '로맨스 선호 X'];
const CHARACTER_GENDERS = ['남자 캐릭터', '여자 캐릭터', '그 외'];
const CHARACTER_AGES = ['10대 미만', '10대', '20대', '30대', '40대', '50대', '60대', '70대 이상'];
const CHARACTER_TRAITS = ['쿨·냉정', '다정·힐링', '열혈·정의', '츤데레', '악역·광기', '지능캐', '개그캐', '미스터리'];

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
  { kicker: 'PROFILE', title: '당신에 대해 알려주세요', icon: UserRound },
  { kicker: 'UNIVERSE', title: '어떤 세계를 좋아하나요?', icon: Gamepad2 },
  { kicker: 'CHARACTER', title: '최애의 취향을 골라주세요', icon: Heart },
  { kicker: 'TITLES', title: '좋아하는 작품을 담아주세요', icon: Sparkles },
];

export function TasteLanding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(EMPTY_PROFILE);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ANIME_TITLES.map((title, index) => ({ title, index })).filter(
      ({ title }) => !q || title.toLowerCase().includes(q),
    );
  }, [query]);

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

  const canContinue =
    step === 0
      ? Boolean(profile.residence && profile.gender && profile.age && profile.orientations.length)
      : step === 1
        ? Boolean(profile.contentTypes.length && profile.relationships.length)
        : step === 2
          ? Boolean(profile.characterGenders.length && profile.characterAges.length && profile.characterTraits.length)
          : selected.length > 0;

  const finish = () => {
    const workIds = selected
      .map((index) => WORKS[index]?.id)
      .filter((id): id is string => Boolean(id));
    onComplete({ workIds, profile });
  };

  const CurrentIcon = STEPS[step].icon;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white">
              <Sparkles size={18} />
            </span>
            <span className="font-black tracking-tight">오조사마</span>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
            {step + 1} / {STEPS.length}
          </span>
        </header>

        <div className="mb-6 grid grid-cols-4 gap-2" aria-label="가입 진행률">
          {STEPS.map(({ title }, index) => (
            <div key={title} className="h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full bg-violet-600 transition-all duration-500 ${
                  index <= step ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600">
              <CurrentIcon size={23} />
            </span>
            <div>
              <p className="text-[11px] font-black tracking-[0.24em] text-violet-600">{STEPS[step].kicker}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{STEPS[step].title}</h1>
              <p className="mt-2 text-sm text-slate-400">
                {step === 3
                  ? 'CSV에 등록된 전체 작품을 둘러보세요. 검색하거나 스크롤해 여러 개 선택할 수 있어요.'
                  : '복수 선택 항목은 마음 가는 만큼 골라도 괜찮아요.'}
              </p>
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
                    className="field-control"
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
                    className="field-control"
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
              <p className="text-xs text-slate-500">입력 정보는 이 기기의 개인화 추천 설정에만 저장돼요.</p>
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
              <ChoiceGroup
                label="선호 캐릭터 분위기·속성"
                hint="중복 선택 가능"
                options={CHARACTER_TRAITS}
                selected={profile.characterTraits}
                onToggle={(value) => toggleField('characterTraits', value)}
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="relative">
                {!query && (
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                )}
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="애니·게임·웹툰·버츄얼 작품 검색"
                  className="field-control field-control-search"
                />
              </div>

              {selected.length > 0 && (
                <div className="mt-4 flex max-h-24 flex-wrap gap-2 overflow-y-auto border-b border-slate-200 pb-4">
                  {selected.map((index) => (
                    <button
                      key={index}
                      onClick={() => toggleTitle(index)}
                      className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-200"
                    >
                      {ANIME_TITLES[index]} <X size={13} />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">전체 {results.length}개</span>
                <span className="text-violet-600">{selected.length}개 선택</span>
              </div>
              <div className="mt-3 grid max-h-[36vh] min-h-60 grid-cols-1 gap-2 overflow-y-auto pr-2 scrollbar-thin sm:grid-cols-2 lg:grid-cols-3">
                {results.map(({ title, index }) => {
                  const active = selected.includes(index);
                  return (
                    <button
                      key={`${title}-${index}`}
                      onClick={() => toggleTitle(index)}
                      className={`flex min-h-14 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                        active
                          ? 'border-violet-500 bg-violet-50 text-violet-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/50'
                      }`}
                    >
                      <span>{title}</span>
                      {active && <Check size={16} className="shrink-0 text-violet-600" />}
                    </button>
                  );
                })}
              </div>
              {results.length === 0 && <p className="py-10 text-center text-sm text-slate-500">일치하는 작품이 없어요.</p>}
            </div>
          )}

          <footer className="mt-8 flex items-center gap-3 border-t border-slate-200 pt-5">
            {step > 0 && (
              <button
                onClick={() => setStep((current) => current - 1)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft size={17} /> 이전
              </button>
            )}
            <button
              onClick={() => (step === STEPS.length - 1 ? finish() : setStep((current) => current + 1))}
              disabled={!canContinue}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {step === STEPS.length - 1 ? '내 추천 시작하기' : '다음 단계'} <ArrowRight size={17} />
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}

function FieldLabel({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <span className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
      {icon} {text}
    </span>
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
      <legend className="mb-3 text-sm font-bold text-slate-700">
        {label} {hint && <span className="ml-1 text-xs font-medium text-violet-500">· {hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              type="button"
              key={option}
              onClick={() => onToggle(option)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${
                active
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-slate-800'
              }`}
            >
              <span className={`grid h-4 w-4 place-items-center rounded-full border ${active ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300'}`}>
                {active && <Check size={11} />}
              </span>
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
