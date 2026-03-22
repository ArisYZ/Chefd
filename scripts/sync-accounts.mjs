/**
 * Recomputes data/accounts.json from data/recipes.json so:
 * - recipeCount / reviewCount match real authored recipes and written reviews
 * - averageRating = avg 0–10 from reviews this user wrote (make again)
 * - rankingScore / leaderboardRank = cook leaderboard score (dishes × quality × engagement)
 *
 * Run: node scripts/sync-accounts.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const recipesPath = path.join(root, 'data', 'recipes.json');
const accountsPath = path.join(root, 'data', 'accounts.json');

function encoreAvgFromReviews(reviews) {
  if (!reviews?.length) return { avg: 0, total: 0 };
  let sum = 0;
  for (const r of reviews) {
    sum += r.makeAgain === 'yes' ? 5 : r.makeAgain === 'maybe' ? 3 : 1;
  }
  return { avg: sum / reviews.length, total: reviews.length };
}

function reviewerAvg10(reviews) {
  if (!reviews?.length) return 0;
  let sum = 0;
  for (const r of reviews) {
    sum += r.makeAgain === 'yes' ? 10 : r.makeAgain === 'maybe' ? 5 : 0;
  }
  return Math.round((sum / reviews.length) * 100) / 100;
}

function computeCookScore(recipeCount, dishEncoreWeighted, ratingsReceived) {
  const quality = dishEncoreWeighted ?? 0;
  if (recipeCount === 0 || ratingsReceived === 0) {
    return Math.round(recipeCount * quality * 10);
  }
  return Math.round(quality * recipeCount * 25 * Math.log(1 + ratingsReceived));
}

const recipesFile = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));

const authorRecipes = new Map();
const reviewsByReviewer = new Map();

for (const [authorId, bucket] of Object.entries(recipesFile)) {
  if (!bucket?.recipes) continue;
  for (const recipe of bucket.recipes) {
    const revs = recipe.reviews || [];
    const { avg, total } = encoreAvgFromReviews(revs);
    if (!authorRecipes.has(authorId)) authorRecipes.set(authorId, []);
    authorRecipes.get(authorId).push({
      id: recipe.id,
      averageRating: avg,
      totalRatings: total,
    });
    for (const rv of revs) {
      const rid = rv.user?.id;
      if (!rid) continue;
      if (!reviewsByReviewer.has(rid)) reviewsByReviewer.set(rid, []);
      reviewsByReviewer.get(rid).push(rv);
    }
  }
}

for (const u of accounts.users) {
  const owned = authorRecipes.get(u.id) || [];
  const recipeCount = owned.length;
  let num = 0;
  let den = 0;
  for (const r of owned) {
    if (r.totalRatings > 0) {
      num += r.averageRating * r.totalRatings;
      den += r.totalRatings;
    }
  }
  const weighted = den > 0 ? Math.round((num / den) * 100) / 100 : null;
  const written = reviewsByReviewer.get(u.id) || [];
  const reviewCount = written.length;
  const averageRating = reviewCount > 0 ? reviewerAvg10(written) : 0;
  const cookScore = computeCookScore(recipeCount, weighted, den);

  u.recipeCount = recipeCount;
  u.reviewCount = reviewCount;
  u.averageRating = averageRating;
  u.rankingScore = cookScore;
}

accounts.users.sort((a, b) => b.rankingScore - a.rankingScore || a.createdAt - b.createdAt);
accounts.users.forEach((u, i) => {
  u.leaderboardRank = i + 1;
});

fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
console.log('Updated data/accounts.json from data/recipes.json');
for (const u of accounts.users.slice(0, 5)) {
  console.log(`  #${u.leaderboardRank} ${u.displayName}: score ${u.rankingScore}, ${u.recipeCount} recipes, ${u.reviewCount} reviews written, dish ratings ${authorRecipes.get(u.id)?.reduce((s, r) => s + r.totalRatings, 0) ?? 0}`);
}
