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
  comment?: string;
  likes: number;
  liked: boolean;
  timestamp: string;
}

export interface IngredientMeasured {
  name: string;
  measurement: string;
}

export interface Recipe {
  id: string;
  /** Account id of the recipe creator when known. */
  createdByUserId?: string | null;
  /** Human-friendly creator name to display in UI. */
  createdByName?: string;
  name: string;
  cuisine: string;
  category: string;
  tags: string[];
  image: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  ingredientsMeasured: IngredientMeasured[];
  instructions: string[];
  averageRating: number;
  totalRatings: number;
}

/**
 * Derive a 0-10 score from reviews.
 * yes = 10, maybe = 5, no = 0 → averaged.
 * Returns null when there are no reviews.
 */
export function computeScore(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, r) => {
    if (r.makeAgain === 'yes') return sum + 10;
    if (r.makeAgain === 'maybe') return sum + 5;
    return sum;
  }, 0);
  return parseFloat((total / reviews.length).toFixed(1));
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
