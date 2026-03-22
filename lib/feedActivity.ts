import type { Recipe, Review, User, RecipeRating } from '@/types';
import type { StoredUser } from '@/types/auth';

/** Parses labels like "2d ago", "1h ago" into approximate epoch ms (event time). */
export function relativeTimestampToApproxMs(label: string, now = Date.now()): number {
  const m = label
    .trim()
    .toLowerCase()
    .match(/^(\d+)\s*(s|sec|secs|m|min|mins|h|hr|hrs|d|day|days|w|wk|wks|mo|mos|y|yr|yrs)s?\s*ago$/);
  if (!m) return now;
  const n = parseInt(m[1], 10);
  const u = m[2];
  let msAgo = 0;
  if (u === 's' || u === 'sec' || u === 'secs') msAgo = n * 1000;
  else if (u === 'm' || u === 'min' || u === 'mins') msAgo = n * 60 * 1000;
  else if (u === 'h' || u === 'hr' || u === 'hrs') msAgo = n * 60 * 60 * 1000;
  else if (u === 'd' || u === 'day' || u === 'days') msAgo = n * 24 * 60 * 60 * 1000;
  else if (u === 'w' || u === 'wk' || u === 'wks') msAgo = n * 7 * 24 * 60 * 60 * 1000;
  else if (u === 'mo' || u === 'mos') msAgo = n * 30 * 24 * 60 * 60 * 1000;
  else if (u === 'y' || u === 'yr' || u === 'yrs') msAgo = n * 365 * 24 * 60 * 60 * 1000;
  return now - msAgo;
}

export function postedAtMsFromUserRecipeId(id: string): number | null {
  const m = /^ur-(\d+)$/.exec(id);
  if (!m) return null;
  return parseInt(m[1], 10);
}

export function formatShortTimeAgo(ms: number, now = Date.now()): string {
  const diff = Math.max(0, now - ms);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function activityRatingForReview(review: Review, recipe: Recipe): number {
  if (review.tasteRating != null && review.tasteRating > 0) return review.tasteRating;
  return recipe.averageRating ?? 0;
}

export type ActivityFeedItem =
  | { kind: 'review'; rating: RecipeRating }
  | {
      kind: 'recipe_post';
      id: string;
      recipe: Recipe;
      user: User;
      postedAtMs: number;
      ratingScore: number;
    };

export function userForRecipePost(
  recipe: Recipe,
  authUser: StoredUser | null,
  getMockUser: (id: string) => User | undefined,
): User {
  const uid = recipe.createdByUserId;
  if (uid) {
    const mock = getMockUser(uid);
    if (mock) return mock;
    if (authUser?.id === uid) {
      return {
        id: authUser.id,
        name: authUser.displayName,
        username: authUser.username,
        avatar: authUser.avatarUri ?? 'https://i.pravatar.cc/150?img=11',
        bio: authUser.bio,
        followersCount: authUser.followersCount,
        followingCount: authUser.followingCount,
        recipesRated: authUser.reviewCount,
      };
    }
  }
  return {
    id: uid ?? 'unknown',
    name: recipe.createdByName ?? 'Cook',
    username: (recipe.createdByName ?? 'cook').toLowerCase().replace(/\s+/g, ''),
    avatar: 'https://i.pravatar.cc/150?img=3',
    bio: '',
    followersCount: 0,
    followingCount: 0,
    recipesRated: 0,
  };
}

export function sortActivityFeedItems(items: ActivityFeedItem[], now = Date.now()): ActivityFeedItem[] {
  return [...items].sort((a, b) => {
    const ta =
      a.kind === 'review'
        ? relativeTimestampToApproxMs(a.rating.review.timestamp, now)
        : a.postedAtMs;
    const tb =
      b.kind === 'review'
        ? relativeTimestampToApproxMs(b.rating.review.timestamp, now)
        : b.postedAtMs;
    if (tb !== ta) return tb - ta;
    const ra = a.kind === 'review' ? activityRatingForReview(a.rating.review, a.rating.recipe) : a.ratingScore;
    const rb = b.kind === 'review' ? activityRatingForReview(b.rating.review, b.rating.recipe) : b.ratingScore;
    return rb - ra;
  });
}
