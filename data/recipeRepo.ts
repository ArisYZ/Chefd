import type { Recipe, Review } from '@/types';
import accountsFile from '@/data/accounts.json';
import type { RepoAccountsFile } from '@/database/accountRepo';
import { formatIngredientLine, normalizeRecipeIngredientsMeasured } from '@/lib/ingredients';

/**
 * Recipe storage model:
 * - `data/recipes.json` is the bundled catalog: keyed by author user id (e.g. u_test_account_1), each value has `recipes` + embedded `reviews` (UI seed + scores).
 * - At runtime, `RecipeContext` merges these with per-user AsyncStorage (`@chefd_user_recipes_<userId>`) for locally added recipes and `@chefd_user_reviews` for app-submitted reviews.
 * - Account rows for sign-in live in `data/accounts.json` (merged into SQLite / web store on launch).
 */

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
  ingredientsMeasured: import('@/types').IngredientMeasured[];
  instructions: string[];
  averageRating: number;
  totalRatings: number;
  reviews: Review[];
}

/** Shape of data/recipes.json: keyed by userId. */
export type RepoRecipesFile = Record<string, { recipes: RepoRecipeEntry[] }>;

/**
 * Flatten the per-user recipe file into a single recipe array and a review map.
 * Pass `accountsOverride` after a remote pull so creator names match DB without a Metro restart.
 */
export function parseRecipesFile(
  file: RepoRecipesFile,
  accountsOverride?: RepoAccountsFile | null,
): {
  recipes: Recipe[];
  reviewsByRecipeId: Record<string, Review[]>;
} {
  const recipes: Recipe[] = [];
  const reviewsByRecipeId: Record<string, Review[]> = {};
  const accounts = accountsOverride ?? (accountsFile as RepoAccountsFile);
  const creatorNameById = new Map(accounts.users.map((u) => [u.id, u.displayName]));

  for (const userId of Object.keys(file)) {
    const entry = file[userId];
    if (!entry?.recipes) continue;
    for (const r of entry.recipes) {
      const { reviews, ...recipeFields } = r;
      const rf = recipeFields as Recipe;
      const measured = normalizeRecipeIngredientsMeasured(rf.ingredientsMeasured ?? []);
      const ingredientsLines =
        measured.length > 0 ? measured.map(formatIngredientLine) : rf.ingredients ?? [];
      recipes.push({
        ...rf,
        ingredientsMeasured: measured,
        ingredients: ingredientsLines,
        createdByUserId: userId,
        createdByName: creatorNameById.get(userId) ?? userId,
      });
      if (reviews && reviews.length > 0) {
        reviewsByRecipeId[r.id] = reviews;
      }
    }
  }

  return { recipes, reviewsByRecipeId };
}

/**
 * Build a `data/recipes.json`-shaped object from the bundled seed, session reviews, and user-added recipes.
 */
export function buildMergedRecipesRepoFile(input: {
  baseSeed: RepoRecipesFile;
  seedReviewsByRecipeId: Record<string, Review[]>;
  userReviewsByRecipeId: Record<string, Review[]>;
  userRecipes: Recipe[];
}): RepoRecipesFile {
  const file = JSON.parse(JSON.stringify(input.baseSeed)) as RepoRecipesFile;

  function mergeReviewLists(recipeId: string): Review[] {
    const user = input.userReviewsByRecipeId[recipeId] ?? [];
    const seed = input.seedReviewsByRecipeId[recipeId] ?? [];
    const merged = [...user, ...seed];
    const seen = new Set<string>();
    return merged.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }

  for (const uid of Object.keys(file)) {
    const bucket = file[uid];
    if (!bucket?.recipes) continue;
    for (const r of bucket.recipes) {
      r.reviews = mergeReviewLists(r.id);
    }
  }

  for (const ur of input.userRecipes) {
    const authorId = ur.createdByUserId ?? 'unknown';
    if (!file[authorId]) file[authorId] = { recipes: [] };
    const reviews = mergeReviewLists(ur.id);
    const entry: RepoRecipeEntry = {
      id: ur.id,
      name: ur.name,
      cuisine: ur.cuisine,
      category: ur.category,
      tags: ur.tags,
      image: ur.image,
      prepTime: ur.prepTime,
      cookTime: ur.cookTime,
      servings: ur.servings,
      difficulty: ur.difficulty,
      ingredients: ur.ingredients,
      ingredientsMeasured: ur.ingredientsMeasured ?? [],
      instructions: ur.instructions,
      averageRating: ur.averageRating,
      totalRatings: ur.totalRatings,
      reviews,
    };
    const idx = file[authorId].recipes.findIndex((x) => x.id === ur.id);
    if (idx >= 0) file[authorId].recipes[idx] = entry;
    else file[authorId].recipes.push(entry);
  }

  return file;
}
