import type { Recipe, Review, LeaderboardEntry } from '@/types';
import { computeScore } from '@/types';

export type RecipeLeaderTimeRange = 'all-time' | 'weekly';
export type RecipeLeaderSort = 'score' | 'most-rated';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Age of review in ms (how long ago it was posted). ISO or relative e.g. "2d ago". */
export function reviewAgeMs(timestamp: string): number | null {
  const t = timestamp.trim();
  const iso = Date.parse(t);
  if (Number.isFinite(iso)) {
    return Math.max(0, Date.now() - iso);
  }
  const rel = /^(\d+)\s*([dh])\s*ago$/i.exec(t);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const unit = rel[2].toLowerCase();
    return unit === 'd' ? n * 86400000 : n * 3600000;
  }
  return null;
}

function filterReviewsByWindow(reviews: Review[], timeRange: RecipeLeaderTimeRange): Review[] {
  if (timeRange === 'all-time') return reviews;
  return reviews.filter((r) => {
    const age = reviewAgeMs(r.timestamp);
    if (age == null) return true;
    return age <= WEEK_MS;
  });
}

/**
 * Leaderboard rows from live reviews (all-time or last 7 days of activity).
 */
export function buildRecipeLeaderboardEntries(
  recipes: Recipe[],
  getReviewsForRecipe: (recipeId: string) => Review[],
  timeRange: RecipeLeaderTimeRange,
  sortBy: RecipeLeaderSort,
): LeaderboardEntry[] {
  const rows = recipes.map((recipe) => {
    const raw = getReviewsForRecipe(recipe.id);
    const reviews = filterReviewsByWindow(raw, timeRange);
    const avg = computeScore(reviews);
    return {
      recipe,
      averageRating: avg ?? 0,
      totalRatings: reviews.length,
      cuisine: recipe.cuisine,
    };
  });

  const sorted =
    sortBy === 'most-rated'
      ? [...rows].sort((a, b) => b.totalRatings - a.totalRatings || b.averageRating - a.averageRating)
      : [...rows].sort((a, b) => b.averageRating - a.averageRating || b.totalRatings - a.totalRatings);

  return sorted.map((e, i) => ({
    ...e,
    rank: i + 1,
  }));
}
