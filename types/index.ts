export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  recipesRated: number;
}

export type MakeAgain = 'yes' | 'no' | 'maybe';

export interface Review {
  id: string;
  user: User;
  recipeId: string;
  makeAgain: MakeAgain;
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Optional taste rating 1-5 (half-star precision allowed, e.g. 3.5) */
  tasteRating?: number;
  /** Optional flavor notes (150 char max) */
  flavorNotes?: string;
  comment?: string;
  likes: number;
  liked: boolean;
  timestamp: string;
}

export interface IngredientMeasured {
  name: string;
  /** Numeric or fractional quantity, e.g. "500", "1/2", "2" */
  amount?: string;
  /** Unit from the measurement picker (e.g. mL, g, cup) */
  unit?: string;
  /** Legacy: combined amount+unit text (e.g. "1 cup (reserved)") */
  measurement?: string;
}

export interface Recipe {
  id: string;
  /** Account id of the recipe creator when known. */
  createdByUserId?: string | null;
  /** Human-friendly creator name to display in UI. */
  createdByName?: string;
  name: string;
  /** Optional backstory or context (500 char max). */
  description?: string;
  cuisine: string;
  category: string;
  tags: string[];
  /** Flavor profile tags (max 4): Sweet, Savory, Spicy, etc. */
  flavorTags?: string[];
  image: string;
  /** Optional per-step photos (index corresponds to instructions index). */
  stepPhotos?: (string | null)[];
  prepTime: number;
  cookTime: number;
  /** 'minutes' or 'hours' — used for display. Stored times are always in minutes. */
  prepTimeUnit?: 'minutes' | 'hours';
  cookTimeUnit?: 'minutes' | 'hours';
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  ingredientsMeasured: IngredientMeasured[];
  instructions: string[];
  averageRating: number;
  totalRatings: number;
  /** URL this recipe was imported from. */
  sourceUrl?: string;
  /** Display name of the source (e.g. "AllRecipes"). */
  sourceName?: string;
}

/**
 * Encore Score (1–5): average of each review’s **“Would you make it again?”** answer.
 * yes = 5, maybe = 3, no = 1. Returns null when there are no reviews.
 */
export function computeScore(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, r) => {
    if (r.makeAgain === 'yes') return sum + 5;
    if (r.makeAgain === 'maybe') return sum + 3;
    return sum + 1;
  }, 0);
  return parseFloat((total / reviews.length).toFixed(1));
}

/**
 * Average taste rating (1–5.0) from reviews that include a taste score.
 * Returns null when no taste ratings exist (aggregate shows "— / 5.0" in UI).
 */
export function computeTasteScore(reviews: Review[]): number | null {
  const rated = reviews.filter((r) => r.tasteRating != null && r.tasteRating > 0);
  if (rated.length === 0) return null;
  const total = rated.reduce((sum, r) => sum + r.tasteRating!, 0);
  return parseFloat((total / rated.length).toFixed(1));
}

export interface RecipeRating {
  id: string;
  user: User;
  recipe: Recipe;
  review: Review;
  likes: number;
  comments: number;
  liked: boolean;
  timestamp: string;
}

export interface RecipeList {
  id: string;
  title: string;
  description: string;
  image: string;
  recipes: Recipe[];
  createdBy: User;
  userProgress?: { tried: number; total: number };
}

export interface LeaderboardEntry {
  rank: number;
  recipe: Recipe;
  averageRating: number;
  totalRatings: number;
  cuisine: string;
}

export interface BookmarkCollection {
  id: string;
  name: string;
  recipeIds: string[];
  createdAt: number;
}

export interface BookmarkData {
  /** All bookmarked recipe IDs (reverse chronological). */
  all: string[];
  /** User-created collections. */
  collections: BookmarkCollection[];
}

export interface Challenge {
  id: string;
  title: string;
  theme: string;
  description: string;
  startDate: string;
  endDate: string;
  entries: string[];
  winnerId?: string;
}
