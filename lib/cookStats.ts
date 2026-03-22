import type { Recipe, Review } from '@/types';
import type { StoredUser } from '@/types/auth';

/**
 * Average “make again” score (1–5.0) for reviews this user wrote — same as Encore / `computeScore`.
 */
export function reviewerEncoreAvg5(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((s, r) => {
    if (r.makeAgain === 'yes') return s + 5;
    if (r.makeAgain === 'maybe') return s + 3;
    return s + 1;
  }, 0);
  return parseFloat((sum / reviews.length).toFixed(2));
}

/** Weighted average Encore (1–5) for recipes this user authored. */
export function authorDishEncoreWeighted(ownedRecipes: Recipe[]): {
  weighted: number | null;
  ratingsReceived: number;
} {
  let num = 0;
  let den = 0;
  for (const r of ownedRecipes) {
    if (r.totalRatings > 0) {
      num += r.averageRating * r.totalRatings;
      den += r.totalRatings;
    }
  }
  if (den === 0) return { weighted: null, ratingsReceived: 0 };
  return {
    weighted: parseFloat((num / den).toFixed(2)),
    ratingsReceived: den,
  };
}

/**
 * Cook leaderboard score: favors many highly-rated dishes (volume × quality × community engagement).
 * Same formula should be used when syncing data/accounts.json `rankingScore`.
 */
export function computeCookScore(
  recipeCount: number,
  dishEncoreWeighted: number | null,
  ratingsReceived: number,
): number {
  const quality = dishEncoreWeighted ?? 0;
  if (recipeCount === 0 || ratingsReceived === 0) {
    return Math.round(recipeCount * quality * 10);
  }
  return Math.round(
    quality * recipeCount * 25 * Math.log(1 + ratingsReceived),
  );
}

export type CookLeaderboardRow = {
  user: StoredUser;
  recipeCount: number;
  reviewsWritten: number;
  /** Avg Encore (1–5) on reviews they wrote. */
  reviewerEncoreAvg: number | null;
  dishEncoreWeighted: number | null;
  dishRatingsReceived: number;
  cookScore: number;
  rank: number;
};

/**
 * Build cook rows from live recipes + reviews. `users` should be all accounts (e.g. from DB).
 * Sorted by cookScore desc; rank 1 = top cook.
 */
export function buildCookLeaderboardRows(
  recipes: Recipe[],
  getReviewsForRecipe: (recipeId: string) => Review[],
  users: StoredUser[],
): CookLeaderboardRow[] {
  const reviewsByReviewer = new Map<string, Review[]>();
  for (const recipe of recipes) {
    for (const rev of getReviewsForRecipe(recipe.id)) {
      const uid = rev.user.id;
      if (!reviewsByReviewer.has(uid)) reviewsByReviewer.set(uid, []);
      reviewsByReviewer.get(uid)!.push(rev);
    }
  }

  const rows: CookLeaderboardRow[] = [];

  for (const user of users) {
    const owned = recipes.filter((r) => r.createdByUserId === user.id);
    const { weighted, ratingsReceived } = authorDishEncoreWeighted(owned);
    const written = reviewsByReviewer.get(user.id) ?? [];
    const reviewerEncoreAvg = reviewerEncoreAvg5(written);
    const cookScore = computeCookScore(owned.length, weighted, ratingsReceived);

    rows.push({
      user,
      recipeCount: owned.length,
      reviewsWritten: written.length,
      reviewerEncoreAvg,
      dishEncoreWeighted: weighted,
      dishRatingsReceived: ratingsReceived,
      cookScore,
      rank: 0,
    });
  }

  rows.sort((a, b) => {
    if (b.cookScore !== a.cookScore) return b.cookScore - a.cookScore;
    return a.user.createdAt - b.user.createdAt;
  });
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  return rows;
}
