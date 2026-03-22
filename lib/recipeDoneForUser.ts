import type { Recipe, Review } from '@/types';

/**
 * A recipe counts as "done" for an account if they created it or have left any review on it.
 */
export function isRecipeDoneForAccount(
  recipe: Recipe,
  userId: string | null | undefined,
  getReviewsForRecipe: (recipeId: string) => Review[],
): boolean {
  if (!userId) return false;
  if (recipe.createdByUserId === userId) return true;
  return getReviewsForRecipe(recipe.id).some((r) => r.user.id === userId);
}

export function countAccountDoneRecipes(
  recipes: Recipe[],
  userId: string | null | undefined,
  getReviewsForRecipe: (recipeId: string) => Review[],
): number {
  if (!userId) return 0;
  return recipes.filter((r) => isRecipeDoneForAccount(r, userId, getReviewsForRecipe)).length;
}
