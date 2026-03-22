import type { Recipe, Review } from '@/types';
import accountsFile from '@/data/accounts.json';
import type { RepoAccountsFile } from '@/database/accountRepo';
import { formatIngredientLine, normalizeRecipeIngredientsMeasured } from '@/lib/ingredients';

/**
 * Recipe storage model:
 * - `data/recipes.json` in the repo is the bundled catalog: keyed by author user id, each value has `recipes` + embedded `reviews`.
 * - User-added recipes and session reviews are merged into this shape via `buildMergedRecipesRepoFile` and persisted to AsyncStorage (`@chefd_recipes_json_override`) so the merged JSON matches what you commit/push.
 * - After GitHub push or `git pull`, other devices load the same data; the bundle seed is overridden by stored JSON when present.
 * - Per-user recipe lines still live in `@chefd_user_recipes_<userId>` until merged into the snapshot (deduped in UI by recipe id).
 */

/** Shape of each recipe entry in data/recipes.json (includes embedded reviews). */
export interface RepoRecipeEntry {
  id: string;
  name: string;
  description?: string;
  cuisine: string;
  category: string;
  tags: string[];
  flavorTags?: string[];
  image: string;
  stepPhotos?: (string | null)[];
  prepTime: number;
  cookTime: number;
  prepTimeUnit?: 'minutes' | 'hours';
  cookTimeUnit?: 'minutes' | 'hours';
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  ingredientsMeasured: import('@/types').IngredientMeasured[];
  instructions: string[];
  averageRating: number;
  totalRatings: number;
  reviews: Review[];
  sourceUrl?: string;
  sourceName?: string;
}

/** Shape of data/recipes.json: keyed by userId. */
export type RepoRecipesFile = Record<string, { recipes: RepoRecipeEntry[] }>;

/**
 * Merge repo `data/recipes.json` with a persisted AsyncStorage override.
 * The override alone can be an outdated snapshot (missing authors/recipes after an app update);
 * this keeps every recipe from the bundled catalog and overlays session edits by recipe id.
 */
export function mergeBundledRecipesWithOverride(
  base: RepoRecipesFile,
  override: RepoRecipesFile | null,
): RepoRecipesFile {
  if (!override) return base;
  const merged = JSON.parse(JSON.stringify(base)) as RepoRecipesFile;
  for (const uid of Object.keys(override)) {
    const bucket = override[uid];
    if (!bucket?.recipes?.length) continue;
    if (!merged[uid]) merged[uid] = { recipes: [] };
    const byId = new Map(merged[uid].recipes.map((r) => [r.id, r]));
    for (const r of bucket.recipes) {
      byId.set(r.id, r);
    }
    merged[uid].recipes = Array.from(byId.values());
  }
  return merged;
}

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

      const totalRatings = reviews?.length ?? 0;
      let averageRating = 0;
      if (totalRatings > 0) {
        const encoreSum = reviews.reduce((sum: number, rev: Review) => {
          if (rev.makeAgain === 'yes') return sum + 5;
          if (rev.makeAgain === 'maybe') return sum + 3;
          return sum + 1;
        }, 0);
        averageRating = parseFloat((encoreSum / totalRatings).toFixed(1));
      }

      recipes.push({
        ...rf,
        ingredientsMeasured: measured,
        ingredients: ingredientsLines,
        averageRating,
        totalRatings,
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

  /** Drop user-posted recipes (ur-*) that were removed from storage but left in a previous merged snapshot. */
  const userRecipeIds = new Set(input.userRecipes.map((r) => r.id));
  for (const uid of Object.keys(file)) {
    const bucket = file[uid];
    if (!bucket?.recipes) continue;
    bucket.recipes = bucket.recipes.filter(
      (r) => !r.id.startsWith('ur-') || userRecipeIds.has(r.id),
    );
  }

  for (const ur of input.userRecipes) {
    const authorId = ur.createdByUserId ?? 'unknown';
    if (!file[authorId]) file[authorId] = { recipes: [] };
    const reviews = mergeReviewLists(ur.id);
    const entry: RepoRecipeEntry = {
      id: ur.id,
      name: ur.name,
      description: ur.description,
      cuisine: ur.cuisine,
      category: ur.category,
      tags: ur.tags,
      flavorTags: ur.flavorTags,
      image: ur.image,
      stepPhotos: ur.stepPhotos,
      prepTime: ur.prepTime,
      cookTime: ur.cookTime,
      prepTimeUnit: ur.prepTimeUnit,
      cookTimeUnit: ur.cookTimeUnit,
      servings: ur.servings,
      difficulty: ur.difficulty,
      ingredients: ur.ingredients,
      ingredientsMeasured: ur.ingredientsMeasured ?? [],
      instructions: ur.instructions,
      averageRating: ur.averageRating,
      totalRatings: ur.totalRatings,
      reviews,
      sourceUrl: ur.sourceUrl,
      sourceName: ur.sourceName,
    };
    const idx = file[authorId].recipes.findIndex((x) => x.id === ur.id);
    if (idx >= 0) file[authorId].recipes[idx] = entry;
    else file[authorId].recipes.push(entry);
  }

  return file;
}
