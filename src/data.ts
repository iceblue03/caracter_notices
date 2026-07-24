import { ShopFeed } from './types';

export const MOCK_FEEDS: ShopFeed[] = [
  {
    id: '1',
    shopName: '애니메이트 서울홍대점',
    platform: 'twitter',
    handle: '@animate_hongdae',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=animate',
    content: '【입고소식 / #주술회전】\n\n주술회전 굿즈가 대량 입고되었습니다!\n아크릴 스탠드, 캔뱃지 등 다양한 상품을 지금 바로 만나보세요! ✨\n\n#홍대애니메이트',
    imageUrl: 'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=600&h=400&fit=crop',
    postedAt: '2시간 전',
    link: '#'
  },
  {
    id: '2',
    shopName: '닌텐도 스토어',
    platform: 'instagram',
    handle: '@nintendostore_kr',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=nintendo',
    content: '동물의 숲 신규 인형 라인업 입고 안내 🍃\n귀여운 주민들을 지금 스토어에서 확인해보세요!',
    imageUrl: 'https://images.unsplash.com/photo-1596742578500-b6f722ff2db4?w=600&h=400&fit=crop',
    postedAt: '5시간 전',
    link: '#'
  },
  {
    id: '3',
    shopName: '제일복권 (이치방쿠지)',
    platform: 'twitter',
    handle: '@ichibankuji_kr',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=kuji',
    content: '⭐ 제일복권 스파이 패밀리 ~Mission Start!~\n내일부터 전국 지정 매장에서 순차적으로 발매됩니다!\n\nA상 아냐 포저 피규어를 놓치지 마세요! 🥜',
    postedAt: '1일 전',
    link: '#'
  }
];
