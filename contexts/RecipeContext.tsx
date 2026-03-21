import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, Review } from '@/types';
import seedRecipesFile from '@/data/recipes.json';
import {
  buildMergedRecipesRepoFile,
  parseRecipesFile,
  type RepoRecipesFile,
} from '@/data/recipeRepo';
import { mergeAccountsFromJsonString } from '@/database/db';
import type { RepoAccountsFile } from '@/database/accountRepo';
import { useAuth } from '@/contexts/AuthContext';
import { formatIngredientLine, normalizeRecipeIngredientsMeasured } from '@/lib/ingredients';

const RECIPES_STORAGE_KEY = '@chefd_user_recipes';
const REVIEWS_STORAGE_KEY = '@chefd_user_reviews';
const RECIPES_OVERRIDE_KEY = '@chefd_recipes_json_override';
const ACCOUNTS_PARSE_OVERRIDE_KEY = '@chefd_accounts_json_parse_override';

type RecipeContextValue = {
  recipes: Recipe[];
  getRecipeById: (id: string) => Recipe | undefined;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'averageRating' | 'totalRatings'>) => string;
  getReviewsForRecipe: (recipeId: string) => Review[];
  addReview: (review: Review) => void;
  /** Serialized `data/recipes.json` including session reviews and user-added recipes. */
  exportMergedRecipesJson: () => string;
  /** After pulling from GitHub: merge accounts into DB and refresh recipe seed + name map. */
  applyPulledDataJson: (accountsJson: string, recipesJson: string) => Promise<void>;
};

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [userReviews, setUserReviews] = useState<Record<string, Review[]>>({});
  const [recipesSeedOverride, setRecipesSeedOverride] = useState<RepoRecipesFile | null>(null);
  const [accountsNameOverride, setAccountsNameOverride] = useState<RepoAccountsFile | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rRaw, aRaw] = await Promise.all([
          AsyncStorage.getItem(RECIPES_OVERRIDE_KEY),
          AsyncStorage.getItem(ACCOUNTS_PARSE_OVERRIDE_KEY),
        ]);
        if (cancelled) return;
        if (rRaw) {
          const parsed = JSON.parse(rRaw) as RepoRecipesFile;
          setRecipesSeedOverride(parsed);
        }
        if (aRaw) {
          setAccountsNameOverride(JSON.parse(aRaw) as RepoAccountsFile);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const seedBundle = useMemo(
    () => recipesSeedOverride ?? (seedRecipesFile as unknown as RepoRecipesFile),
    [recipesSeedOverride],
  );

  const { seedRecipes, seedReviews } = useMemo(() => {
    const parsed = parseRecipesFile(seedBundle, accountsNameOverride);
    return { seedRecipes: parsed.recipes, seedReviews: parsed.reviewsByRecipeId };
  }, [seedBundle, accountsNameOverride]);

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
          if (Array.isArray(parsed)) {
            setUserRecipes(
              parsed.map((r) => {
                const measured = normalizeRecipeIngredientsMeasured(r.ingredientsMeasured ?? []);
                const ingredients =
                  measured.length > 0 ? measured.map(formatIngredientLine) : r.ingredients ?? [];
                return {
                  ...r,
                  ingredientsMeasured: measured,
                  ingredients,
                  createdByUserId: r.createdByUserId ?? userId,
                  createdByName: r.createdByName ?? user?.displayName ?? user?.username ?? 'You',
                };
              }),
            );
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.displayName, user?.username, userId]);

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
    return () => {
      cancelled = true;
    };
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

  const recipes = useMemo(() => [...seedRecipes, ...userRecipes], [seedRecipes, userRecipes]);

  const getRecipeById = useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes],
  );

  const addRecipe = useCallback(
    (data: Omit<Recipe, 'id' | 'averageRating' | 'totalRatings'>) => {
      const id = `ur-${Date.now()}`;
      const next: Recipe = {
        ...data,
        id,
        averageRating: 0,
        totalRatings: 0,
        createdByUserId: userId,
        createdByName: user?.displayName ?? user?.username ?? 'You',
      };
      setUserRecipes((prev) => {
        const merged = [...prev, next];
        persistRecipes(merged);
        return merged;
      });
      return id;
    },
    [persistRecipes, user?.displayName, user?.username, userId],
  );

  const getReviewsForRecipe = useCallback(
    (recipeId: string): Review[] => {
      const seed = seedReviews[recipeId] ?? [];
      const user = userReviews[recipeId] ?? [];
      return [...user, ...seed];
    },
    [seedReviews, userReviews],
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

  const exportMergedRecipesJson = useCallback(() => {
    return JSON.stringify(
      buildMergedRecipesRepoFile({
        baseSeed: seedBundle,
        seedReviewsByRecipeId: seedReviews,
        userReviewsByRecipeId: userReviews,
        userRecipes,
      }),
      null,
      2,
    );
  }, [seedBundle, seedReviews, userReviews, userRecipes]);

  const applyPulledDataJson = useCallback(async (accountsJson: string, recipesJson: string) => {
    await mergeAccountsFromJsonString(accountsJson);
    await AsyncStorage.setItem(ACCOUNTS_PARSE_OVERRIDE_KEY, accountsJson);
    setAccountsNameOverride(JSON.parse(accountsJson) as RepoAccountsFile);
    await AsyncStorage.setItem(RECIPES_OVERRIDE_KEY, recipesJson);
    setRecipesSeedOverride(JSON.parse(recipesJson) as RepoRecipesFile);
  }, []);

  const value = useMemo(
    () => ({
      recipes,
      getRecipeById,
      addRecipe,
      getReviewsForRecipe,
      addReview,
      exportMergedRecipesJson,
      applyPulledDataJson,
    }),
    [
      recipes,
      getRecipeById,
      addRecipe,
      getReviewsForRecipe,
      addReview,
      exportMergedRecipesJson,
      applyPulledDataJson,
    ],
  );

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipes() {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipeProvider');
  return ctx;
}
