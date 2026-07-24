import { Character } from './types';

/**
 * Curated catalogue of subscribable characters.
 *
 * `keywords` / `hashtags` drive the relevance filter: a scraped SNS post is
 * shown to a subscriber only if its text contains one of these terms. Keep the
 * terms specific enough that unrelated posts don't leak in.
 */
export const CHARACTERS: Character[] = [
  // ── 주술회전 / Jujutsu Kaisen ──────────────────────────────────────────
  {
    id: 'gojo',
    name: '고죠 사토루',
    nameEn: 'Gojo Satoru',
    series: '주술회전',
    seriesEn: 'Jujutsu Kaisen',
    role: '특급 주술사',
    emoji: '🌀',
    color: '#3b82f6',
    gradient: ['#60a5fa', '#4338ca'],
    popularity: 98,
    tagline: '가장 강한 주술사, 육안과 무하한.',
    keywords: ['고죠', '사토루', '고죠사토루', 'gojo', 'satoru'],
    hashtags: ['고죠사토루', 'gojosatoru', '고죠', 'gojo'],
    sourceAccounts: ['jujutsukaisen_official', 'animate_seoul'],
  },
  {
    id: 'itadori',
    name: '이타도리 유지',
    nameEn: 'Itadori Yuji',
    series: '주술회전',
    seriesEn: 'Jujutsu Kaisen',
    role: '주술고전 1학년',
    emoji: '👊',
    color: '#ef4444',
    gradient: ['#fb7185', '#e11d48'],
    popularity: 84,
    tagline: '스쿠나의 그릇, 착한 심장의 소년.',
    keywords: ['이타도리', '유지', '이타도리유지', 'itadori', 'yuji'],
    hashtags: ['이타도리유지', 'itadoriyuji', '이타도리'],
    sourceAccounts: ['jujutsukaisen_official'],
  },
  {
    id: 'megumi',
    name: '후시구로 메구미',
    nameEn: 'Fushiguro Megumi',
    series: '주술회전',
    seriesEn: 'Jujutsu Kaisen',
    role: '십종영법술 계승자',
    emoji: '🐕',
    color: '#1e293b',
    gradient: ['#475569', '#0f172a'],
    popularity: 79,
    tagline: '옥견을 부리는 냉정한 술사.',
    keywords: ['메구미', '후시구로', '후시구로메구미', 'megumi', 'fushiguro'],
    hashtags: ['후시구로메구미', 'megumi', '메구미'],
    sourceAccounts: ['jujutsukaisen_official'],
  },

  // ── SPY×FAMILY ────────────────────────────────────────────────────────
  {
    id: 'anya',
    name: '아냐 포저',
    nameEn: 'Anya Forger',
    series: '스파이 패밀리',
    seriesEn: 'SPY×FAMILY',
    role: '초능력 소녀',
    emoji: '🥜',
    color: '#f472b6',
    gradient: ['#f9a8d4', '#db2777'],
    popularity: 96,
    tagline: '와쿠와쿠! 마음을 읽는 첩보 가족의 딸.',
    keywords: ['아냐', '포저', '아냐포저', 'anya', 'forger', '아냥'],
    hashtags: ['아냐포저', 'anyaforger', '아냐', 'anya'],
    sourceAccounts: ['spyfamily_anime', 'animate_seoul'],
  },
  {
    id: 'yor',
    name: '요르 포저',
    nameEn: 'Yor Forger',
    series: '스파이 패밀리',
    seriesEn: 'SPY×FAMILY',
    role: '가시 공주',
    emoji: '🌹',
    color: '#e11d48',
    gradient: ['#fb7185', '#9f1239'],
    popularity: 82,
    tagline: '낮에는 시청 직원, 밤에는 암살자.',
    keywords: ['요르', '요르포저', 'yor', '가시공주', 'thornprincess'],
    hashtags: ['요르포저', 'yorforger', '요르'],
    sourceAccounts: ['spyfamily_anime'],
  },

  // ── 귀멸의 칼날 / Demon Slayer ────────────────────────────────────────
  {
    id: 'nezuko',
    name: '카마도 네즈코',
    nameEn: 'Kamado Nezuko',
    series: '귀멸의 칼날',
    seriesEn: 'Demon Slayer',
    role: '혈귀가 된 여동생',
    emoji: '🎋',
    color: '#fb7185',
    gradient: ['#fda4af', '#be123c'],
    popularity: 91,
    tagline: '대나무 통을 문, 오빠를 지키는 혈귀.',
    keywords: ['네즈코', '카마도네즈코', 'nezuko', '네주코'],
    hashtags: ['네즈코', 'nezuko', '카마도네즈코'],
    sourceAccounts: ['kimetsu_official', 'animate_seoul'],
  },
  {
    id: 'tanjiro',
    name: '카마도 탄지로',
    nameEn: 'Kamado Tanjiro',
    series: '귀멸의 칼날',
    seriesEn: 'Demon Slayer',
    role: '물의 호흡 검사',
    emoji: '💧',
    color: '#0d9488',
    gradient: ['#2dd4bf', '#0f766e'],
    popularity: 85,
    tagline: '상냥한 마음의 귀살대 검사.',
    keywords: ['탄지로', '카마도탄지로', 'tanjiro', '탄지로우'],
    hashtags: ['탄지로', 'tanjiro', '카마도탄지로'],
    sourceAccounts: ['kimetsu_official'],
  },
  {
    id: 'rengoku',
    name: '렌고쿠 쿄쥬로',
    nameEn: 'Rengoku Kyojuro',
    series: '귀멸의 칼날',
    seriesEn: 'Demon Slayer',
    role: '염주',
    emoji: '🔥',
    color: '#f59e0b',
    gradient: ['#fbbf24', '#c2410c'],
    popularity: 80,
    tagline: '마음을 불태워라! 염의 주.',
    keywords: ['렌고쿠', '쿄쥬로', '렌고쿠쿄쥬로', 'rengoku', 'kyojuro', '염주'],
    hashtags: ['렌고쿠', 'rengoku', '렌고쿠쿄쥬로'],
    sourceAccounts: ['kimetsu_official'],
  },

  // ── 원피스 / One Piece ────────────────────────────────────────────────
  {
    id: 'luffy',
    name: '몽키 D. 루피',
    nameEn: 'Monkey D. Luffy',
    series: '원피스',
    seriesEn: 'One Piece',
    role: '밀짚모자 선장',
    emoji: '🏴‍☠️',
    color: '#dc2626',
    gradient: ['#f87171', '#b91c1c'],
    popularity: 88,
    tagline: '해적왕이 될 남자, 고무고무.',
    keywords: ['루피', '몽키디루피', 'luffy', '기어5', 'gear5', '조이보이'],
    hashtags: ['루피', 'luffy', '몽키디루피'],
    sourceAccounts: ['onepiece_official'],
  },
  {
    id: 'chopper',
    name: '토니토니 쵸파',
    nameEn: 'Tony Tony Chopper',
    series: '원피스',
    seriesEn: 'One Piece',
    role: '선의',
    emoji: '🦌',
    color: '#ec4899',
    gradient: ['#f9a8d4', '#db2777'],
    popularity: 76,
    tagline: '악마의 열매를 먹은 순록 선의.',
    keywords: ['쵸파', '초파', '토니토니쵸파', 'chopper'],
    hashtags: ['쵸파', 'chopper', '초파'],
    sourceAccounts: ['onepiece_official'],
  },

  // ── 체인소맨 / Chainsaw Man ───────────────────────────────────────────
  {
    id: 'makima',
    name: '마키마',
    nameEn: 'Makima',
    series: '체인소맨',
    seriesEn: 'Chainsaw Man',
    role: '지배의 악마',
    emoji: '🔗',
    color: '#b91c1c',
    gradient: ['#f43f5e', '#7f1d1d'],
    popularity: 83,
    tagline: '모든 것을 지배하려는 자.',
    keywords: ['마키마', 'makima', '지배의악마'],
    hashtags: ['마키마', 'makima'],
    sourceAccounts: ['chainsawman_official'],
  },
  {
    id: 'power',
    name: '파워',
    nameEn: 'Power',
    series: '체인소맨',
    seriesEn: 'Chainsaw Man',
    role: '피의 악마',
    emoji: '🩸',
    color: '#f43f5e',
    gradient: ['#fda4af', '#e11d48'],
    popularity: 81,
    tagline: '제멋대로지만 미워할 수 없는 피의 마인.',
    keywords: ['파워', '파워짱', 'power', '피의악마'],
    hashtags: ['파워', 'powerchan', '체인소맨파워'],
    sourceAccounts: ['chainsawman_official'],
  },

  // ── 최애의 아이 / Oshi no Ko ──────────────────────────────────────────
  {
    id: 'hoshino_ai',
    name: '호시노 아이',
    nameEn: 'Hoshino Ai',
    series: '최애의 아이',
    seriesEn: 'Oshi no Ko',
    role: 'B코마치 아이돌',
    emoji: '⭐',
    color: '#8b5cf6',
    gradient: ['#c4b5fd', '#7c3aed'],
    popularity: 87,
    tagline: '거짓말은 최고의 사랑. 45,141,919.',
    keywords: ['호시노아이', '아이돌아이', 'hoshinoai', 'idolai', 'bkomachi', 'b코마치'],
    hashtags: ['호시노아이', 'hoshinoai', '최애의아이'],
    sourceAccounts: ['oshinoko_anime'],
  },

  // ── 하이큐 / Haikyuu ──────────────────────────────────────────────────
  {
    id: 'hinata',
    name: '히나타 쇼요',
    nameEn: 'Hinata Shoyo',
    series: '하이큐!!',
    seriesEn: 'Haikyuu!!',
    role: '카라스노 미들 블로커',
    emoji: '🏐',
    color: '#f97316',
    gradient: ['#fdba74', '#ea580c'],
    popularity: 78,
    tagline: '작은 거인, 코트 위의 태양.',
    keywords: ['히나타', '쇼요', '히나타쇼요', 'hinata', 'shoyo'],
    hashtags: ['히나타쇼요', 'hinata', '히나타'],
    sourceAccounts: ['haikyu_official'],
  },

  // ── 원신 / Genshin Impact ─────────────────────────────────────────────
  {
    id: 'furina',
    name: '푸리나',
    nameEn: 'Furina',
    series: '원신',
    seriesEn: 'Genshin Impact',
    role: '폰타인 물의 신',
    emoji: '💧',
    color: '#06b6d4',
    gradient: ['#67e8f9', '#0891b2'],
    popularity: 89,
    tagline: '500년의 연극을 홀로 이어온 물의 신.',
    keywords: ['푸리나', 'furina', '포칼로스', 'focalors'],
    hashtags: ['푸리나', 'furina', '원신푸리나'],
    sourceAccounts: ['genshinimpact_kr'],
  },
  {
    id: 'raiden',
    name: '라이덴 쇼군',
    nameEn: 'Raiden Shogun',
    series: '원신',
    seriesEn: 'Genshin Impact',
    role: '이나즈마 번개의 신',
    emoji: '⚡',
    color: '#7c3aed',
    gradient: ['#a78bfa', '#6d28d9'],
    popularity: 85,
    tagline: '영원을 좇는 번개의 신.',
    keywords: ['라이덴', '라이덴쇼군', 'raiden', 'raidenshogun', '바알'],
    hashtags: ['라이덴쇼군', 'raidenshogun', '라이덴'],
    sourceAccounts: ['genshinimpact_kr'],
  },
];

export const CHARACTER_MAP: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);

export function getCharacter(id: string): Character | undefined {
  return CHARACTER_MAP[id];
}

/** All distinct series, ordered by combined popularity (most popular first). */
export function getSeriesList(): { series: string; seriesEn: string; characters: Character[] }[] {
  const bySeries = new Map<string, Character[]>();
  for (const c of CHARACTERS) {
    const list = bySeries.get(c.series) ?? [];
    list.push(c);
    bySeries.set(c.series, list);
  }
  return [...bySeries.entries()]
    .map(([series, characters]) => ({
      series,
      seriesEn: characters[0].seriesEn,
      characters: characters.slice().sort((a, b) => b.popularity - a.popularity),
    }))
    .sort(
      (a, b) =>
        Math.max(...b.characters.map((c) => c.popularity)) -
        Math.max(...a.characters.map((c) => c.popularity)),
    );
}
