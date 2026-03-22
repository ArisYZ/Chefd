import type { StoredUser } from '@/types/auth';
import type { Recipe, Review } from '@/types';

const MAX_UNRATED_CANDIDATES = 100;
const MAX_NOTABLE_CREATORS = 40;

export const CHEF_AI_SYSTEM_PROMPT = `You are Remy Rat, the cooking assistant inside the Chef'd app. You help the user discover recipes, reputable cooks, and cooking questions.

You will receive three data sections:
1) RECIPES_THE_USER_RATED — recipes they tried and how they rated them (make again, taste, difficulty, notes).
2) RECIPES_NOT_YET_RATED — dishes they have not reviewed; when suggesting new things to cook, choose only from this list.
3) NOTABLE_CREATORS — cooks in the app with published recipes and strong average encore scores; use this to suggest people to follow or browse.

Rules:
- Be concise, friendly, and practical.
- When recommending recipes to try next, pick recipe IDs only from RECIPES_NOT_YET_RATED. If that list is empty, say they have rated everything in the catalog (or nearly so) and offer general ideas instead.
- When suggesting cooks to check out, pick user IDs only from NOTABLE_CREATORS (do not invent IDs). Prefer higher average encore and solid recipe/review counts. Skip recommending the user themself when their id appears in context.
- When the user should open a recipe in the app, use [[recipe:RECIPE_ID]] (no spaces inside the brackets; exact recipe id from the data).
- When the user should open someone's profile, use [[profile:USER_ID]] (no spaces inside the brackets; exact user id from NOTABLE_CREATORS).
- For emphasis in your replies, wrap phrases in **double asterisks** so they render as bold in the chat UI.
- For general cooking questions, these link tokens are optional unless they help.
- If the user has not rated any recipes yet, acknowledge that and still answer questions; suggest they rate a few meals so suggestions can improve.`;

function compactRecipeLine(r: Recipe): string {
  const tags = [...(r.tags ?? []), ...(r.flavorTags ?? [])].filter(Boolean).join(', ');
  return [
    r.id,
    r.name,
    r.cuisine,
    r.category,
    r.difficulty,
    tags || '—',
  ].join(' | ');
}

export function buildChefAiDataBlock(options: {
  userId: string | null;
  recipes: Recipe[];
  getReviewsForRecipe: (recipeId: string) => Review[];
}): string {
  const { userId, recipes, getReviewsForRecipe } = options;

  if (!userId) {
    return (
      'RECIPES_THE_USER_RATED — (not signed in; no ratings loaded.)\n' +
      'RECIPES_NOT_YET_RATED — (sign in to personalize.)\n'
    );
  }

  const ratedRows: string[] = [];
  const unratedCandidates: Recipe[] = [];

  for (const recipe of recipes) {
    const reviews = getReviewsForRecipe(recipe.id);
    const mine = reviews.find((rev) => rev.user.id === userId);
    if (mine) {
      const parts = [
        `id=${recipe.id}`,
        `name=${JSON.stringify(recipe.name)}`,
        `cuisine=${recipe.cuisine}`,
        `category=${recipe.category}`,
        `recipeDifficulty=${recipe.difficulty}`,
        `makeAgain=${mine.makeAgain}`,
        `myDifficultyStars=${mine.difficulty}`,
        mine.tasteRating != null ? `taste=${mine.tasteRating}` : null,
        mine.flavorNotes ? `flavorNotes=${JSON.stringify(mine.flavorNotes)}` : null,
        mine.comment ? `comment=${JSON.stringify(mine.comment)}` : null,
      ].filter(Boolean);
      ratedRows.push(parts.join(' · '));
    } else {
      unratedCandidates.push(recipe);
    }
  }

  unratedCandidates.sort((a, b) => a.name.localeCompare(b.name));
  const capped = unratedCandidates.slice(0, MAX_UNRATED_CANDIDATES);
  const truncatedNote =
    unratedCandidates.length > MAX_UNRATED_CANDIDATES
      ? `\n(note: showing first ${MAX_UNRATED_CANDIDATES} of ${unratedCandidates.length} unrated recipes, sorted by name)\n`
      : '';

  const ratedSection =
    ratedRows.length > 0
      ? ratedRows.join('\n')
      : '(none yet — encourage the user to rate recipes after cooking.)';

  const unratedSection =
    capped.length > 0
      ? capped.map(compactRecipeLine).join('\n') + truncatedNote
      : '(empty — user has rated every recipe in the catalog.)';

  return (
    `RECIPES_THE_USER_RATED (${ratedRows.length}):\n${ratedSection}\n\n` +
    `RECIPES_NOT_YET_RATED (${capped.length}):\n${unratedSection}`
  );
}

/**
 * Cooks with at least one recipe and encore data, sorted by average encore (then activity).
 */
export function buildChefAiProfilesBlock(users: StoredUser[], currentUserId: string | null): string {
  const notable = users
    .filter((u) => u.id !== currentUserId)
    .filter((u) => u.recipeCount >= 1 && u.reviewCount >= 1)
    .sort(
      (a, b) =>
        b.averageRating - a.averageRating ||
        b.recipeCount - a.recipeCount ||
        b.rankingScore - a.rankingScore,
    )
    .slice(0, MAX_NOTABLE_CREATORS);

  if (notable.length === 0) {
    return `NOTABLE_CREATORS (0):\n(none yet — need cooks with recipes and reviews in the database.)`;
  }

  const lines = notable.map(
    (u) =>
      `${u.id} | @${u.username} | ${JSON.stringify(u.displayName)} | avg encore ${u.averageRating.toFixed(1)}/5 | recipes ${u.recipeCount} | reviews ${u.reviewCount} | rank #${u.leaderboardRank}`,
  );
  return `NOTABLE_CREATORS (${notable.length}):\n${lines.join('\n')}`;
}
