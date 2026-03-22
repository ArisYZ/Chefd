import { User, Recipe, RecipeList, LeaderboardEntry } from '@/types';
import seedRecipesFile from '@/data/recipes.json';
import seedAccountsFile from '@/data/accounts.json';
import { parseRecipesFile, RepoRecipesFile } from '@/data/recipeRepo';
import type { RepoAccountsFile } from '@/database/accountRepo';

const { recipes: parsedRecipes } = parseRecipesFile(
  seedRecipesFile as unknown as RepoRecipesFile,
);

const accountUsers = (seedAccountsFile as RepoAccountsFile).users;

export const currentUser: User = {
  id: 'u_test_account_1',
  name: 'test',
  username: 'test',
  avatar: 'https://i.pravatar.cc/150?img=11',
  bio: 'Test account — seed recipes author',
  followersCount: 12,
  followingCount: 8,
  recipesRated: accountUsers.find(u => u.id === 'u_test_account_1')?.reviewCount ?? 0,
};

export const users: User[] = accountUsers
  .filter(u => u.id !== 'u_test_account_1')
  .map(u => ({
    id: u.id,
    name: u.displayName,
    username: u.username,
    avatar: u.avatarUri ?? 'https://i.pravatar.cc/150?img=11',
    bio: u.bio,
    followersCount: u.followersCount,
    followingCount: u.followingCount,
    recipesRated: u.reviewCount,
  }));

export const allUsers: User[] = [currentUser, ...users];

export function getUserById(id: string): User | undefined {
  return allUsers.find(u => u.id === id);
}

/** Bundled catalog (same ids as merged RecipeContext after load). Featured lists use this snapshot. */
export const recipes: Recipe[] = parsedRecipes;

function listProgress(recipeList: Recipe[]) {
  const total = recipeList.length;
  return total > 0 ? { tried: 0, total } : undefined;
}

export const featuredLists: RecipeList[] = [
  {
    id: 'fl1',
    title: 'Ultimate Pasta Bucket List',
    description: 'Every pasta dish you need to master',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600',
    recipes: recipes.filter(r => r.category === 'Pasta'),
    createdBy: getUserById('u_fake_luca_g') ?? users[0],
    userProgress: listProgress(recipes.filter(r => r.category === 'Pasta')),
  },
  {
    id: 'fl2',
    title: 'Best Weeknight Dinners',
    description: 'Quick and delicious meals under 30 min',
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600',
    recipes: recipes.filter(r => r.tags.includes('Quick')).slice(0, 4),
    createdBy: getUserById('u_fake_maya_l') ?? users[0],
    userProgress: listProgress(recipes.filter(r => r.tags.includes('Quick')).slice(0, 4)),
  },
  {
    id: 'fl3',
    title: 'Around the World in 10 Dishes',
    description: 'Global flavors from your kitchen',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600',
    recipes: recipes.filter((_, i) => i % 3 === 0).slice(0, 4),
    createdBy: getUserById('u_fake_alex_c') ?? users[0],
    userProgress: listProgress(recipes.filter((_, i) => i % 3 === 0).slice(0, 4)),
  },
  {
    id: 'fl4',
    title: "Baker's Corner",
    description: 'From breads to pastries to desserts',
    image: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=600',
    recipes: recipes.filter(r => ['Bread', 'Dessert', 'Pastry'].includes(r.category)).slice(0, 4),
    createdBy: getUserById('u_fake_sarah_k') ?? users[0],
    userProgress: listProgress(recipes.filter(r => ['Bread', 'Dessert', 'Pastry'].includes(r.category)).slice(0, 4)),
  },
];

export const userLists: RecipeList[] = [
  {
    id: 'ul1',
    title: 'My Favorites',
    description: 'Recipes I keep coming back to',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600',
    recipes: [recipes[0], recipes[1], recipes[3], recipes[7]],
    createdBy: currentUser,
  },
  {
    id: 'ul2',
    title: 'Date Night',
    description: 'Impressive dishes for special occasions',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600',
    recipes: [recipes[0], recipes[4]],
    createdBy: currentUser,
  },
  {
    id: 'ul3',
    title: 'Want to Try',
    description: 'On my cooking bucket list',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
    recipes: [recipes[2], recipes[5], recipes[6]],
    createdBy: currentUser,
  },
];

export function buildLeaderboard(recipeList: Recipe[]): LeaderboardEntry[] {
  return [...recipeList]
    .sort((a, b) => b.averageRating - a.averageRating)
    .map((recipe, index) => ({
      rank: index + 1,
      recipe,
      averageRating: recipe.averageRating,
      totalRatings: recipe.totalRatings,
      cuisine: recipe.cuisine,
    }));
}

export const cuisineFilters = [
  'All',
  'Italian',
  'Japanese',
  'Indian',
  'Thai',
  'Mexican',
  'American',
  'French',
  'Korean',
  'Chinese',
  'Peruvian',
  'Argentine',
];

export const categoryFilters = [
  'All',
  'Pasta',
  'Curry',
  'Soup',
  'Bread',
  'Dessert',
  'Tacos',
  'BBQ',
  'Seafood',
  'Salad',
  'Main',
  'Rice',
  'Pastry',
];
