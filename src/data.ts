import { FeedPost } from './types';

/**
 * Dummy/placeholder posts are intentionally NOT bundled — mixing sample data
 * with real scraped posts is confusing. The feed shows only live posts from
 * /api/feed/sync (backed by the persistent store in data/feed-store.json).
 */
export const SAMPLE_POSTS: FeedPost[] = [];
