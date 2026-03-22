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
   * Rolling average 0–10 of “make again” scores from reviews this user wrote
   * (yes=10, maybe=5, no=0). Synced from data/recipes.json via `npm run sync-data`.
   */
  averageRating: number;
  googleSub: string | null;
  createdAt: number;
  /** Recipe ids this account has favorited (exported in data/accounts.json). */
  favoriteRecipeIds: string[];
}
