import { User, Recipe, RecipeRating, RecipeList, LeaderboardEntry } from '@/types';
import seedRecipesFile from '@/data/recipes.json';
import { parseRecipesFile, RepoRecipesFile } from '@/data/recipeRepo';

/** Seed recipes loaded from data/recipes.json. */
const { recipes: parsedRecipes, reviewsByRecipeId: parsedReviews } = parseRecipesFile(
  seedRecipesFile as unknown as RepoRecipesFile,
);

export const currentUser: User = {
  id: 'u1',
  name: 'Alex Chen',
  username: 'alexcooks',
  avatar: 'https://i.pravatar.cc/150?img=11',
  bio: 'Home cook exploring global flavors. Pasta enthusiast.',
  followersCount: 234,
  followingCount: 189,
  recipesRated: 67,
};

export const users: User[] = [
  currentUser,
  {
    id: 'u2',
    name: 'Sarah Kim',
    username: 'sarahbakes',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Baker & pastry lover',
    followersCount: 512,
    followingCount: 302,
    recipesRated: 94,
  },
  {
    id: 'u3',
    name: 'Marcus Johnson',
    username: 'chefmarcus',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'BBQ master, southern comfort food',
    followersCount: 1243,
    followingCount: 456,
    recipesRated: 156,
  },
  {
    id: 'u4',
    name: 'Priya Patel',
    username: 'priyacooks',
    avatar: 'https://i.pravatar.cc/150?img=9',
    bio: 'Indian home cooking & spice explorer',
    followersCount: 876,
    followingCount: 234,
    recipesRated: 112,
  },
  {
    id: 'u5',
    name: 'Emma Wilson',
    username: 'emmaeats',
    avatar: 'https://i.pravatar.cc/150?img=20',
    bio: 'Healthy meals & meal prep queen',
    followersCount: 345,
    followingCount: 198,
    recipesRated: 45,
  },
];

export const recipes: Recipe[] = parsedRecipes;

// Helper to get seed reviews by recipe ID (used by feedRatings below).
function getSeedReviews(recipeId: string) {
  return parsedReviews[recipeId] ?? [];
}

export const feedRatings: RecipeRating[] = [
  {
    id: 'fr1',
    user: users[1],
    recipe: recipes[0],
    review: getSeedReviews('r1')[0],
    likes: 12,
    comments: 3,
    liked: true,
    timestamp: '5 minutes ago',
  },
  {
    id: 'fr2',
    user: users[2],
    recipe: recipes[7],
    review: getSeedReviews('r8')[0],
    likes: 24,
    comments: 7,
    liked: false,
    timestamp: '15 minutes ago',
  },
  {
    id: 'fr3',
    user: users[3],
    recipe: recipes[1],
    review: getSeedReviews('r2')[0],
    likes: 18,
    comments: 5,
    liked: false,
    timestamp: '1 hour ago',
  },
  {
    id: 'fr4',
    user: users[4],
    recipe: recipes[3],
    review: getSeedReviews('r4')[0],
    likes: 8,
    comments: 2,
    liked: true,
    timestamp: '2 hours ago',
  },
  {
    id: 'fr5',
    user: users[1],
    recipe: recipes[4],
    review: getSeedReviews('r5')[0],
    likes: 15,
    comments: 4,
    liked: false,
    timestamp: '3 hours ago',
  },
  {
    id: 'fr6',
    user: users[2],
    recipe: recipes[2],
    review: getSeedReviews('r3')[0],
    likes: 31,
    comments: 11,
    liked: true,
    timestamp: '5 hours ago',
  },
];

export const featuredLists: RecipeList[] = [
  {
    id: 'fl1',
    title: 'Ultimate Pasta Bucket List',
    description: 'Every pasta dish you need to master',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600',
    recipes: [recipes[0], recipes[4]],
    createdBy: users[2],
    userProgress: { tried: 3, total: 8 },
  },
  {
    id: 'fl2',
    title: 'Best Weeknight Dinners',
    description: 'Quick and delicious meals under 30 min',
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600',
    recipes: [recipes[5], recipes[3]],
    createdBy: users[3],
    userProgress: { tried: 5, total: 12 },
  },
  {
    id: 'fl3',
    title: 'Around the World in 10 Dishes',
    description: 'Global flavors from your kitchen',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600',
    recipes: [recipes[1], recipes[5], recipes[7]],
    createdBy: users[1],
    userProgress: { tried: 2, total: 10 },
  },
  {
    id: 'fl4',
    title: "Bread Baker's Guide",
    description: 'From beginner loaves to artisan breads',
    image: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=600',
    recipes: [recipes[2], recipes[6]],
    createdBy: users[4],
    userProgress: { tried: 1, total: 6 },
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
];

export const categoryFilters = [
  'All',
  'Pasta',
  'Curry',
  'Soup',
  'Bread',
  'Dessert',
  'Tacos',
];
