/** User row persisted in SQLite (Chef'd account). */
export interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  avatarUri: string | null;
  bio: string;
  /** Higher = better placement on cook leaderboard (from reviews + recipes). */
  rankingScore: number;
  /** 1-based rank among all users by rankingScore. */
  leaderboardRank: number;
  followersCount: number;
  followingCount: number;
  recipeCount: number;
  reviewCount: number;
  /**
   * Mean encore score /5.0 from reviews this user wrote (yes=5, maybe=3, no=1),
   * same weighting as recipe encore averages. Synced from data/recipes.json via `npm run sync-data`.
   */
  averageRating: number;
  googleSub: string | null;
  createdAt: number;
  /** Recipe ids this account has favorited (exported in data/accounts.json). */
  favoriteRecipeIds: string[];
}
