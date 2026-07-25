import { FeedPost } from './types';

/**
 * A real-world fandom event announced in one of the collected posts
 * (`src/sampleFeed.json` / the live sync cache).
 *
 * Every field here is transcribed from the source post — nothing is invented.
 * When a post never stated something (a closing day, a venue), the field is
 * left out rather than guessed, and the banner simply omits that line.
 */
export interface FeaturedEvent {
  id: string;
  name: string;
  /** Short kind label shown above the title, e.g. "동인 행사". */
  category: string;
  /** Opening day, `YYYY-MM-DD`, read as a local date. */
  startsAt: string;
  /** Closing day. Omitted when the source post didn't state one. */
  endsAt?: string;
  /** Start–end clock time, only when the post spelled it out. */
  time?: string;
  venue?: string;
  /** One or two lines introducing the event. */
  summary: string;
  /** Bullet-sized selling points, straight from the post. */
  highlights: string[];
  /** Banner accent `[from, to]` — 6-digit hex (alpha is appended at render). */
  accent: [string, string];
  /** `FeedPost.id` this event was lifted from; the banner links back to it. */
  sourcePostId: string;
}

/**
 * Curated in reverse-chronological order of announcement. Only events whose
 * dates the source post actually stated make the list, since the banner leads
 * with a countdown.
 */
export const FEATURED_EVENTS: FeaturedEvent[] = [
  {
    id: 'fun-expo-2026',
    name: 'FUN EXPO 2026',
    category: '게임 · 서브컬처 페어',
    startsAt: '2026-07-30',
    endsAt: '2026-08-02',
    venue: '코엑스마곡',
    summary:
      '반다이남코 엔터테인먼트 코리아가 참가를 알린 나흘간의 게임·서브컬처 페어. 신작 시연대와 MD 부스가 한자리에 모여요.',
    highlights: [
      '‘드래곤볼 제노버스 3’ 국내 최초 공개 시연',
      '‘ELDEN RING 빛바랜 자 에디션’ 체험',
      '타이틀·MD 현장 판매 + 기념품 증정',
    ],
    accent: ['#7c3aed', '#c026d3'],
    sourcePostId: '2080534815322099907',
  },
  {
    id: 'illustar-fes-12',
    name: '일러스타 페스 12',
    category: '창작자 · 동인 행사',
    startsAt: '2026-08-01',
    endsAt: '2026-08-02',
    summary:
      '창작자와 팬이 함께 만드는 종합 서브컬처 축제. 12회와 13회 입장권이 동시에 열렸어요.',
    highlights: ['「일러스타 페스 12 · 13」 입장권 동시 판매 개시', '8월 첫 주말을 채우는 이틀간의 축제'],
    accent: ['#0ea5e9', '#6366f1'],
    sourcePostId: '2066466498307412409',
  },
  {
    id: 'gundam-x-30th-stage',
    name: '건담X 30주년 스페셜 스테이지',
    category: '애니 30주년 스테이지',
    startsAt: '2026-08-01',
    endsAt: '2026-08-01',
    time: '14:30~15:15 (예정)',
    venue: '라라포트 후쿠오카',
    summary:
      '『기동신세기 건담X』 30주년을 기념하는 스페셜 스테이지. 무대 전체가 생중계 라이브로 송출됩니다.',
    highlights: [
      '가로드 역 타카기 와타루 · 티파 역 카나이 미카 등단',
      '현장에 못 가도 생중계로 시청 가능',
    ],
    accent: ['#1d4ed8', '#0891b2'],
    sourcePostId: '2080579993457901652',
  },
  {
    id: 'gundam-base-popup-ehime',
    name: 'THE GUNDAM BASE POP-UP in EHIME',
    category: '팝업 스토어',
    startsAt: '2026-08-01',
    venue: '에미후루 MASAKI (에히메)',
    summary: '건담 베이스가 에히메로. 8월 1일부터 에미후루 MASAKI에서 문을 엽니다.',
    highlights: ['8월 17~20일 나흘간 건프라 조립 체험회'],
    accent: ['#b91c1c', '#ea580c'],
    sourcePostId: '2080563671760003359',
  },
];

/** Where an event sits relative to today. */
export type EventPhase = 'upcoming' | 'today' | 'ongoing' | 'ended';

export interface EventFeature {
  event: FeaturedEvent;
  /** The collected post backing it — supplies the banner image and the link. */
  post?: FeedPost;
  phase: EventPhase;
  /** Whole days until the opening day; 0 on the day itself, negative after. */
  daysUntil: number;
}

/**
 * Open-ended runs (no `endsAt` in the source post) are treated as still on for
 * this many days after opening, so a popup doesn't sit in the banner forever.
 */
const OPEN_ENDED_RUN_DAYS = 30;
const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` → local midnight (avoids the UTC off-by-one of `new Date(s)`). */
function parseDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function phaseOf(event: FeaturedEvent, today: Date): { phase: EventPhase; daysUntil: number } {
  const start = parseDay(event.startsAt);
  const close = event.endsAt
    ? parseDay(event.endsAt)
    : new Date(start.getTime() + OPEN_ENDED_RUN_DAYS * DAY_MS);
  const daysUntil = Math.round((start.getTime() - today.getTime()) / DAY_MS);

  if (today.getTime() > close.getTime()) return { phase: 'ended', daysUntil };
  if (daysUntil > 0) return { phase: 'upcoming', daysUntil };
  return { phase: daysUntil === 0 ? 'today' : 'ongoing', daysUntil };
}

/**
 * Joins `FEATURED_EVENTS` to the posts they came from and orders them by how
 * soon they open. Events that are over are dropped — unless every single one
 * is, in which case the most recent couple are kept so the banner still has
 * something to show (labelled "지난 행사").
 */
export function resolveFeaturedEvents(posts: FeedPost[], now: Date = new Date()): EventFeature[] {
  const byId = new Map(posts.map((post) => [post.id, post]));
  const today = startOfDay(now);

  const all = FEATURED_EVENTS.map((event) => ({
    event,
    post: byId.get(event.sourcePostId),
    ...phaseOf(event, today),
  }));

  const live = all
    .filter((feature) => feature.phase !== 'ended')
    .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
  if (live.length > 0) return live;

  return all
    .sort((a, b) => b.event.startsAt.localeCompare(a.event.startsAt))
    .slice(0, 2);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** e.g. "7월 30일(목) ~ 8월 2일(일)", or a single day when there's no range. */
export function formatEventDates(event: FeaturedEvent): string {
  const day = (value: string) => {
    const date = parseDay(value);
    return `${date.getMonth() + 1}월 ${date.getDate()}일(${WEEKDAYS[date.getDay()]})`;
  };
  const start = day(event.startsAt);
  if (!event.endsAt) return `${start}부터`;
  if (event.endsAt === event.startsAt) return start;
  return `${start} ~ ${day(event.endsAt)}`;
}

/** Countdown chip text: "D-5", "오늘 개막", "진행 중", "지난 행사". */
export function countdownLabel({ phase, daysUntil }: EventFeature): string {
  switch (phase) {
    case 'today':
      return '오늘 개막';
    case 'ongoing':
      return '진행 중';
    case 'ended':
      return '지난 행사';
    default:
      return `D-${daysUntil}`;
  }
}
