import { FeedPost } from './types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// Anchor sample timestamps to load time so relative labels ("N시간 전") stay fresh.
const NOW = Date.now();

/**
 * Bundled sample posts so the feed is fully populated without a live Apify key.
 * Captions intentionally contain character keywords/hashtags so the relevance
 * filter can be seen working. Live posts from /api/feed/sync are merged on top.
 */
export const SAMPLE_POSTS: FeedPost[] = [
  {
    id: 's1',
    author: '애니메이트 서울',
    platform: 'twitter',
    handle: '@animate_seoul',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=animate',
    content:
      '【입고소식 / #주술회전】\n\n#고죠사토루 아크릴 스탠드 신규 디자인이 입고되었습니다! ✨\n무하한을 형상화한 홀로그램 사양으로, 육안 파츠 교체도 가능합니다.\n수량이 많지 않으니 서두르세요!',
    imageUrl:
      'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=800&h=600&fit=crop',
    timestamp: NOW - 2 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's2',
    author: 'SPY×FAMILY 공식',
    platform: 'twitter',
    handle: '@spyfamily_anime',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=spy',
    content:
      '아냐의 표정이 담긴 신규 굿즈 라인업 공개! 🥜\n#아냐포저 의 「와쿠와쿠」 순간을 담은 캔뱃지 12종 세트가 예약 판매를 시작합니다.\n예약 특전으로 미니 색종이도 증정!',
    imageUrl:
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&h=600&fit=crop',
    timestamp: NOW - 3 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's3',
    author: '이치방쿠지 코리아',
    platform: 'instagram',
    handle: '@ichibankuji_kr',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=kuji',
    content:
      '⭐ 제일복권 귀멸의 칼날 ~유곽편~ 발매 안내\nA상은 #네즈코 피규어! 대나무 통 파츠와 혈귀 모드가 재현된 프리미엄 사양입니다.\n전국 지정 매장에서 순차 발매됩니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=800&h=600&fit=crop',
    timestamp: NOW - 5 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's4',
    author: '주술회전 공식',
    platform: 'twitter',
    handle: '@jujutsukaisen_official',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=jjk',
    content:
      '이타도리 유지 생일 기념 일러스트 공개! 🎂\n올해도 #이타도리유지 의 생일을 축하하는 특별 비주얼을 준비했습니다.\n스쿠나와 함께한 1년, 앞으로도 응원해주세요.',
    timestamp: NOW - 8 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's5',
    author: '굿스마일 코리아',
    platform: 'instagram',
    handle: '@goodsmile_kr',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=gsc',
    content:
      '넨도로이드 신제품 예약 안내 🎉\n체인소맨 #파워 가 넨도로이드로 등장! 특유의 뿔과 장난스러운 표정 파츠 3종이 포함됩니다.\n예약은 오늘 저녁 8시부터!',
    imageUrl:
      'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=800&h=600&fit=crop',
    timestamp: NOW - 11 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's6',
    author: '최애의 아이 공식',
    platform: 'twitter',
    handle: '@oshinoko_anime',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=oshi',
    content:
      'B코마치 라이브 재현! ⭐\n#호시노아이 의 상징적인 별 눈동자를 담은 1/7 스케일 피규어가 결정되었습니다.\n「거짓말은 최고의 사랑」— 그 무대를 당신의 방으로.',
    imageUrl:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&h=600&fit=crop',
    timestamp: NOW - 14 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's7',
    author: '원신 코리아',
    platform: 'instagram',
    handle: '@genshinimpact_kr',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=genshin',
    content:
      '폰타인의 물의 신, #푸리나 공식 굿즈 팝업스토어가 성수동에서 오픈합니다! 💧\n한정 아크릴, 틴케이스, 포토카드까지. 방문 인증 시 특전 스티커 증정.\n7/28 ~ 8/10',
    imageUrl:
      'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800&h=600&fit=crop',
    timestamp: NOW - 18 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's8',
    author: '루피팬_그랜드라인',
    platform: 'twitter',
    handle: '@luffy_grandline',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=luffy',
    content:
      '기어5 #루피 피규어 개봉기 올렸습니다! 🏴‍☠️\n조이보이의 미소가 그대로 재현돼서 소름… 도색 퀄리티가 역대급이에요.\n밀짚모자 파츠도 3종 들어있어요.',
    imageUrl:
      'https://images.unsplash.com/photo-1601931935821-5fbe71157695?w=800&h=600&fit=crop',
    timestamp: NOW - 20 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's9',
    author: '귀멸의 칼날 공식',
    platform: 'twitter',
    handle: '@kimetsu_official',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=kimetsu',
    content:
      '「마음을 불태워라」🔥\n#렌고쿠쿄쥬로 를 테마로 한 카페 콜라보가 결정되었습니다.\n염주의 하오리를 모티브로 한 디저트와 특전 코스터를 만나보세요.',
    imageUrl:
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
    timestamp: NOW - 1 * DAY,
    link: '#',
    source: 'sample',
  },
  {
    id: 's10',
    author: '아냐덕질계정',
    platform: 'instagram',
    handle: '@anya_daily',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=anyadaily',
    content:
      '오늘의 #아냐 짤 모음 🥜💕\n와쿠와쿠 표정 볼 때마다 심장이… 아냐 포저는 진리입니다.\n다들 최애 표정 하나씩 골라봐요!',
    imageUrl:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop',
    timestamp: NOW - 1 * DAY - 4 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's11',
    author: '주술회전 공식',
    platform: 'instagram',
    handle: '@jujutsukaisen_official',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=jjk',
    content:
      '후시구로 메구미 피규어 채색 원형 공개 🐕\n#후시구로메구미 의 십종영법술 「옥견」을 함께 배치한 디오라마 사양입니다.\n자세한 발매 정보는 곧 공개됩니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop',
    timestamp: NOW - 1 * DAY - 9 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's12',
    author: '하이큐 코리아',
    platform: 'twitter',
    handle: '@haikyu_official',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=haikyu',
    content:
      '「코트 위의 태양」☀️🏐\n#히나타쇼요 유니폼 넘버 10을 새긴 저지 굿즈가 재입고되었습니다.\n카라스노 팬이라면 놓치지 마세요!',
    timestamp: NOW - 1 * DAY - 15 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's13',
    author: '체인소맨 공식',
    platform: 'twitter',
    handle: '@chainsawman_official',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=csm',
    content:
      '지배의 악마, #마키마 를 테마로 한 신규 태피스트리 발매 결정.\n서늘한 눈빛을 그대로 담아냈습니다. 예약은 이번 주말부터.',
    imageUrl:
      'https://images.unsplash.com/photo-1614851099175-e5b30eb6f696?w=800&h=600&fit=crop',
    timestamp: NOW - 2 * DAY,
    link: '#',
    source: 'sample',
  },
  {
    id: 's14',
    author: '원신 코리아',
    platform: 'twitter',
    handle: '@genshinimpact_kr',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=genshin',
    content:
      '영원을 좇는 번개의 신 ⚡\n#라이덴쇼군 아크릴 지비츠 & 스마트톡 세트가 공식 스토어에 입고되었습니다.\n무상의 검을 형상화한 한정 디자인입니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=600&fit=crop',
    timestamp: NOW - 2 * DAY - 6 * HOUR,
    link: '#',
    source: 'sample',
  },
  {
    id: 's15',
    author: '원피스 공식',
    platform: 'instagram',
    handle: '@onepiece_official',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=onepiece',
    content:
      '선의 #쵸파 의 벚꽃 버전 인형이 새롭게 등장했습니다! 🦌🌸\n말랑말랑한 촉감과 큼직한 사이즈로 인기 예감. 예약 수량 한정입니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=800&h=600&fit=crop',
    timestamp: NOW - 3 * DAY,
    link: '#',
    source: 'sample',
  },
  {
    id: 's16',
    author: '건담베이스 서울',
    platform: 'instagram',
    handle: '@gundambase_seoul',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=gundam',
    content:
      'RG 신제품 입고 안내 🤖\n이번 주 신상 건프라 라인업이 도착했습니다. 매장 방문 고객 대상 조립 이벤트도 진행하니 많은 참여 바랍니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=800&h=600&fit=crop',
    timestamp: NOW - 3 * DAY - 10 * HOUR,
    link: '#',
    source: 'sample',
  },
];
