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

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  /** Dietary / style labels (e.g. vegan, high-protein) */
  tags: string[];
  image: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  instructions: string[];
  averageRating: number;
  totalRatings: number;
}

export interface RecipeRating {
  id: string;
  user: User;
  recipe: Recipe;
  rating: number;
  notes: string;
  favoritePart?: string;
  withUsers?: User[];
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
