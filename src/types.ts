export interface ShopFeed {
  id: string;
  shopName: string;
  platform: 'instagram' | 'twitter';
  handle: string;
  avatarUrl: string;
  content: string;
  imageUrl?: string;
  postedAt: string;
  link: string;
}
