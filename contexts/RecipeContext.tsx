import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, Review } from '@/types';
import seedRecipesFile from '@/data/recipes.json';
import { parseRecipesFile, RepoRecipesFile } from '@/data/recipeRepo';
import { useAuth } from '@/contexts/AuthContext';

const RECIPES_STORAGE_KEY = '@chefd_user_recipes';
const REVIEWS_STORAGE_KEY = '@chefd_user_reviews';

/** Seed data parsed once from the bundled JSON. */
const { recipes: seedRecipes, reviewsByRecipeId: seedReviews } = parseRecipesFile(
  seedRecipesFile as unknown as RepoRecipesFile,
);

type RecipeContextValue = {
  recipes: Recipe[];
  getRecipeById: (id: string) => Recipe | undefined;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'averageRating' | 'totalRatings' | 'ingredientsMeasured'>) => string;
  getReviewsForRecipe: (recipeId: string) => Review[];
  addReview: (review: Review) => void;
};

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [userReviews, setUserReviews] = useState<Record<string, Review[]>>({});

  // Load user-created recipes from AsyncStorage
  useEffect(() => {
    let cancelled = false;
    setUserRecipes([]);
    (async () => {
      const key = userId ? `${RECIPES_STORAGE_KEY}_${userId}` : `${RECIPES_STORAGE_KEY}_anonymous`;
      try {
        const raw = await AsyncStorage.getItem(key);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as Recipe[];
          if (Array.isArray(parsed)) setUserRecipes(parsed);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Load user-submitted reviews from AsyncStorage
  useEffect(() => {
    let cancelled = false;
    setUserReviews({});
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, Review[]>;
          if (parsed && typeof parsed === 'object') setUserReviews(parsed);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistRecipes = useCallback(
    async (next: Recipe[]) => {
      const key = userId ? `${RECIPES_STORAGE_KEY}_${userId}` : `${RECIPES_STORAGE_KEY}_anonymous`;
      try {
        await AsyncStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [userId],
  );

  const persistReviews = useCallback(async (next: Record<string, Review[]>) => {
    try {
      await AsyncStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const recipes = useMemo(
    () => [...seedRecipes, ...userRecipes],
    [userRecipes],
  );

  const getRecipeById = useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes],
  );

  const addRecipe = useCallback(
    (data: Omit<Recipe, 'id' | 'averageRating' | 'totalRatings' | 'ingredientsMeasured'>) => {
      const id = `ur-${Date.now()}`;
      const next: Recipe = {
        ...data,
        id,
        averageRating: 0,
        totalRatings: 0,
        ingredientsMeasured: [],
      };
      setUserRecipes((prev) => {
        const merged = [...prev, next];
        persistRecipes(merged);
        return merged;
      });
      return id;
    },
    [persistRecipes],
  );

  const getReviewsForRecipe = useCallback(
    (recipeId: string): Review[] => {
      const seed = seedReviews[recipeId] ?? [];
      const user = userReviews[recipeId] ?? [];
      return [...user, ...seed];
    },
    [userReviews],
  );

  const addReview = useCallback(
    (review: Review) => {
      setUserReviews((prev) => {
        const existing = prev[review.recipeId] ?? [];
        const next = { ...prev, [review.recipeId]: [review, ...existing] };
        persistReviews(next);
        return next;
      });
    },
    [persistReviews],
  );

  const value = useMemo(
    () => ({
      recipes,
      getRecipeById,
      addRecipe,
      getReviewsForRecipe,
      addReview,
    }),
    [recipes, getRecipeById, addRecipe, getReviewsForRecipe, addReview],
  );

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipes() {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipeProvider');
  return ctx;
}
