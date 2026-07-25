import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Smile } from 'lucide-react';
import type { AnalyticsSummary } from '../lib/analyticsSummary';

interface Props {
  onBack: () => void;
}

const VIEW_LABELS: Record<string, string> = {
  feed: '홈 피드',
  discover: '캐릭터 탐색',
  character: '캐릭터 상세',
  stats: '통계',
};

const FEATURE_LABELS: Record<string, string> = {
  '구독': '구독',
  '구독 해제': '구독 해제',
  translate: '번역',
  search: '검색',
  filter_genre: '장르 필터',
  filter_character: '캐릭터 필터',
  view_original_post: '원본 게시물 보기',
  event_banner_click: '행사 배너 클릭',
};

const FIELD_LABELS: Record<string, string> = {
  residence: '거주지역',
  age: '나이',
  gender: '성별',
  orientations: '콘텐츠 성향',
  contentTypes: '주로 즐기는 콘텐츠',
  relationships: '선호 관계성',
  characterGenders: '선호 캐릭터 성별',
  characterAges: '선호 캐릭터 나이대',
  characterTraits: '선호 캐릭터 속성',
  titles: '온보딩에서 고른 작품',
};

const viewLabel = (view: string) => VIEW_LABELS[view] ?? view;
const featureLabel = (feature: string) => FEATURE_LABELS[feature] ?? feature;
const fieldLabel = (field: string) => FIELD_LABELS[field] ?? field;

export function StatsView({ onBack }: Props) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch('/api/analytics/summary')
      .then((res) => {
        if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
        return res.json();
      })
      .then((data) => setSummary(data))
      .catch((err) => setError(err?.message || '통계를 불러오지 못했어요.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-16">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <button
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} /> 뒤로
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">사용자 테스트 통계</h1>
          <p className="text-sm text-slate-500 mt-1">
            이 서버에 쌓인 이벤트를 바탕으로 자동 집계돼요. (관리자 전용 화면)
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:border-violet-200 hover:text-violet-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> 새로고침
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600 mb-6">
          {error} — 서버 모드로 실행 중인지 확인해주세요 (정적 호스팅에는 이 API가 없어요).
        </div>
      )}

      {!summary && !error && <div className="py-20 text-center text-slate-400">불러오는 중…</div>}

      {summary && summary.overview.totalEvents === 0 && (
        <div className="py-20 text-center text-slate-400">
          아직 수집된 이벤트가 없어요. 앱을 사용하면 여기 통계가 채워져요.
        </div>
      )}

      {summary && summary.overview.totalEvents > 0 && (
        <div className="space-y-8">
          <OverviewGrid overview={summary.overview} />

          <Section title="어디서 멈추는지" subtitle="세션이 마지막으로 머문 화면 · 화면별 체류 시간">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card title="마지막으로 본 화면">
                <BarList
                  items={summary.dropOff.lastScreenBeforeQuiet.map((d) => ({ label: viewLabel(d.view), value: d.count }))}
                />
              </Card>
              <Card title="화면별 체류 시간">
                {summary.dropOff.viewDwell.length === 0 ? (
                  <EmptyNote />
                ) : (
                  <ul className="space-y-2.5">
                    {summary.dropOff.viewDwell.map((d) => (
                      <li key={d.view} className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">{viewLabel(d.view)}</span>
                        <span className="text-slate-400">평균 {d.avgSeconds}초 · 방문 {d.visits}회</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </Section>

          <Section title="어디서 되돌아가는지" subtitle="캐릭터 상세에서 ‘뒤로’가 눌린 화면 기준">
            <Card>
              <BarList items={summary.backNav.map((b) => ({ label: viewLabel(b.from), value: b.count }))} />
            </Card>
          </Section>

          <Section title="언제 포기하는지" subtitle="온보딩 퍼널 도달률 · 이탈 단계">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card
                title={`온보딩 완료율 ${Math.round(summary.onboarding.completionRate * 100)}% (${summary.onboarding.completedSessions}/${summary.onboarding.startedSessions})`}
              >
                <FunnelBars steps={summary.onboarding.funnel} />
              </Card>
              <Card title="이탈 시점">
                <BarList items={summary.onboarding.abandonment.map((a) => ({ label: a.label, value: a.count }))} />
              </Card>
            </div>
          </Section>

          <Section title="어떤 표정인지" subtitle="온보딩 중 미쿠가 반응한 순간">
            <Card>
              {summary.mascotExpressions.length === 0 ? (
                <EmptyNote />
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {summary.mascotExpressions.map((m) => (
                    <li
                      key={`${m.mood}-${m.replyKey}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700"
                    >
                      <Smile size={13} /> {m.replyKey} <span className="text-violet-400">×{m.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Section>

          <Section title="핵심 기능은 무엇인지" subtitle="실제로 가장 많이 쓰인 기능 순">
            <Card>
              <BarList items={summary.featureUsage.map((f) => ({ label: featureLabel(f.feature), value: f.count }))} />
            </Card>
          </Section>

          <Section title="무엇을 선호하는지" subtitle="구독 · 온보딩 취향 집계">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card title="가장 많이 구독된 대상">
                <BarList
                  items={summary.preferences.topSubscribed.map((s) => ({
                    label: s.kind === 'character' ? `${s.name} · 캐릭터` : s.name,
                    value: s.count,
                  }))}
                />
              </Card>
              <Card title="작품 구독 vs 캐릭터 구독">
                <KindSplit split={summary.preferences.subscribeKindSplit} />
              </Card>
            </div>
            {summary.preferences.fields.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {summary.preferences.fields.map((f) => (
                  <Card key={f.field} title={fieldLabel(f.field)}>
                    <BarList items={f.values.map((v) => ({ label: v.value, value: v.count }))} />
                  </Card>
                ))}
              </div>
            )}
          </Section>

          {summary.rageClicks.length > 0 && (
            <Section title="답답해하는 지점" subtitle="같은 요소를 짧은 시간에 3번 이상 누른 경우">
              <Card>
                <BarList items={summary.rageClicks.map((r) => ({ label: r.target, value: r.count }))} />
              </Card>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function OverviewGrid({ overview }: { overview: AnalyticsSummary['overview'] }) {
  const items = [
    { label: '전체 이벤트', value: overview.totalEvents.toLocaleString() },
    { label: '세션 수', value: overview.sessions.toLocaleString() },
    { label: '방문 기기 수', value: overview.clients.toLocaleString() },
    { label: '평균 세션 길이', value: `${overview.avgSessionMinutes}분` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
          <p className="text-2xl font-black leading-none text-slate-900">{item.value}</p>
          <p className="mt-1.5 text-xs font-semibold text-slate-400">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 mb-3 mt-0.5">{subtitle}</p>}
      <div className={subtitle ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      {title && <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>}
      {children}
    </div>
  );
}

function EmptyNote() {
  return <p className="text-sm text-slate-400">아직 데이터가 없어요.</p>;
}

/** Ranked horizontal bars for a "what's biggest" list — one hue, magnitude by width. */
function BarList({ items }: { items: { label: string; value: number }[] }) {
  if (items.length === 0) return <EmptyNote />;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.slice(0, 10).map((item, i) => (
        <li key={`${item.label}-${i}`}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium text-slate-700">{item.label}</span>
            <span className="shrink-0 font-semibold text-slate-400">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600"
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The onboarding funnel: reach-rate per stage, in stage order (not sorted by size). */
function FunnelBars({ steps }: { steps: AnalyticsSummary['onboarding']['funnel'] }) {
  if (steps.every((s) => s.reached === 0)) return <EmptyNote />;
  return (
    <ul className="space-y-2.5">
      {steps.map((s) => (
        <li key={s.step}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-slate-700">
              {s.step + 1}. {s.label}
            </span>
            <span className="shrink-0 font-semibold text-slate-400">
              {s.reached}명 · {Math.round(s.reachedRate * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600"
              style={{ width: `${Math.max(s.reachedRate * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Fixed 2-category split, direct-labeled so it needs no separate legend. */
function KindSplit({ split }: { split: { kind: string; count: number }[] }) {
  const work = split.find((s) => s.kind === 'work')?.count ?? 0;
  const character = split.find((s) => s.kind === 'character')?.count ?? 0;
  const total = work + character;
  if (total === 0) return <EmptyNote />;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="bg-violet-600" style={{ width: `${(work / total) * 100}%` }} />
        <div className="bg-fuchsia-500" style={{ width: `${(character / total) * 100}%` }} />
      </div>
      <div className="mt-2.5 flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-violet-700">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-600" /> 작품 {work}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-fuchsia-600">
          <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" /> 캐릭터 {character}
        </span>
      </div>
    </div>
  );
}
