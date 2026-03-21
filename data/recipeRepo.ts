import { Recipe, Review } from '@/types';

/** Shape of each recipe entry in data/recipes.json (includes embedded reviews). */
export interface RepoRecipeEntry {
  id: string;
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
  ingredientsMeasured: { name: string; measurement: string }[];
  instructions: string[];
  averageRating: number;
  totalRatings: number;
  reviews: Review[];
}

/** Shape of data/recipes.json: keyed by userId. */
export type RepoRecipesFile = Record<string, { recipes: RepoRecipeEntry[] }>;

/**
 * Flatten the per-user recipe file into a single recipe array and a review map.
 */
export function parseRecipesFile(file: RepoRecipesFile): {
  recipes: Recipe[];
  reviewsByRecipeId: Record<string, Review[]>;
} {
  const recipes: Recipe[] = [];
  const reviewsByRecipeId: Record<string, Review[]> = {};

  for (const userId of Object.keys(file)) {
    const entry = file[userId];
    if (!entry?.recipes) continue;
    for (const r of entry.recipes) {
      const { reviews, ...recipeFields } = r;
      recipes.push(recipeFields as Recipe);
      if (reviews && reviews.length > 0) {
        reviewsByRecipeId[r.id] = reviews;
      }
    }
  }

  return { recipes, reviewsByRecipeId };
}
