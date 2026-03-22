import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Recipe, Review } from '@/types';
import seedRecipesFile from '@/data/recipes.json';
import {
  buildMergedRecipesRepoFile,
  parseRecipesFile,
  type RepoRecipesFile,
} from '@/data/recipeRepo';
import {
  decrementRecipeCount,
  exportAccountsJsonForRepo,
  getUserById,
  mergeAccountsFromJsonString,
  setRecipeCount,
} from '@/database/db';
import type { RepoAccountsFile } from '@/database/accountRepo';
import { useAuth } from '@/contexts/AuthContext';
import { formatIngredientLine, normalizeRecipeIngredientsMeasured } from '@/lib/ingredients';
import { getGithubDataSyncConfig, pushDataJsonFilesToGithub } from '@/lib/githubDataSync';

function isAutoPushGitHubDataEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_AUTO_PUSH_DATA === '1') return true;
  const extra = Constants.expoConfig?.extra as { autoPushGitHubData?: boolean } | undefined;
  return extra?.autoPushGitHubData === true;
}

const RECIPES_STORAGE_KEY = '@chefd_user_recipes';
const REVIEWS_STORAGE_KEY = '@chefd_user_reviews';
const RECIPES_OVERRIDE_KEY = '@chefd_recipes_json_override';
const ACCOUNTS_PARSE_OVERRIDE_KEY = '@chefd_accounts_json_parse_override';

type RecipeContextValue = {
  recipes: Recipe[];
  getRecipeById: (id: string) => Recipe | undefined;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'averageRating' | 'totalRatings'>) => string;
  /** Removes a user-owned recipe from local storage and session reviews. Returns false if not owned. */
  deleteRecipe: (recipeId: string) => Promise<boolean>;
  getReviewsForRecipe: (recipeId: string) => Review[];
  addReview: (review: Review) => void;
  /** Serialized `data/recipes.json` including session reviews and user-added recipes. */
  exportMergedRecipesJson: () => string;
  /** After pulling from GitHub: merge accounts into DB and refresh recipe seed + name map. */
  applyPulledDataJson: (accountsJson: string, recipesJson: string) => Promise<void>;
};

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  const userId = user?.id ?? null;
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [userReviews, setUserReviews] = useState<Record<string, Review[]>>({});
  const [recipesSeedOverride, setRecipesSeedOverride] = useState<RepoRecipesFile | null>(null);
  const [accountsNameOverride, setAccountsNameOverride] = useState<RepoAccountsFile | null>(null);
  const autoPushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Load user-created recipes from AsyncStorage; align DB recipe_count with stored list (fixes drift).
  useEffect(() => {
    let cancelled = false;
    setUserRecipes([]);
    (async () => {
      const key = userId ? `${RECIPES_STORAGE_KEY}_${userId}` : `${RECIPES_STORAGE_KEY}_anonymous`;
      try {
        const raw = await AsyncStorage.getItem(key);
        if (cancelled) return;
        let nextList: Recipe[] = [];
        if (raw) {
          const parsed = JSON.parse(raw) as Recipe[];
          if (Array.isArray(parsed)) {
            nextList = parsed.map((r) => {
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
            });
          }
        }
        setUserRecipes(nextList);
        if (cancelled || !userId) return;
        try {
          const u = await getUserById(userId);
          if (u && nextList.length !== u.recipeCount) {
            await setRecipeCount(userId, nextList.length);
            await refreshUser();
          }
        } catch {
          /* ignore DB sync */
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.displayName, user?.username, userId, refreshUser]);

  const reviewsKey = userId ? `${REVIEWS_STORAGE_KEY}_${userId}` : `${REVIEWS_STORAGE_KEY}_anonymous`;

  // Load user-submitted reviews from AsyncStorage (per-user)
  useEffect(() => {
    let cancelled = false;
    setUserReviews({});
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(reviewsKey);
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
  }, [reviewsKey]);

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
      await AsyncStorage.setItem(reviewsKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [reviewsKey]);

  /** Merged seed JSON may already include user-posted recipes; avoid listing the same id twice. */
  const recipes = useMemo(() => {
    const seedIds = new Set(seedRecipes.map((r) => r.id));
    const extraFromUserStorage = userRecipes.filter((r) => !seedIds.has(r.id));
    return [...seedRecipes, ...extraFromUserStorage];
  }, [seedRecipes, userRecipes]);

  const persistMergedRecipesSnapshot = useCallback(async () => {
    try {
      const merged = buildMergedRecipesRepoFile({
        baseSeed: seedBundle,
        seedReviewsByRecipeId: seedReviews,
        userReviewsByRecipeId: userReviews,
        userRecipes,
      });
      const json = JSON.stringify(merged, null, 2);
      const prev = await AsyncStorage.getItem(RECIPES_OVERRIDE_KEY);
      if (prev !== json) {
        await AsyncStorage.setItem(RECIPES_OVERRIDE_KEY, json);
        setRecipesSeedOverride(merged);
        if (isAutoPushGitHubDataEnabled() && getGithubDataSyncConfig()) {
          if (autoPushTimerRef.current) clearTimeout(autoPushTimerRef.current);
          autoPushTimerRef.current = setTimeout(() => {
            autoPushTimerRef.current = null;
            void (async () => {
              try {
                const accountsJson = await exportAccountsJsonForRepo();
                const recipesJson = await AsyncStorage.getItem(RECIPES_OVERRIDE_KEY);
                if (!recipesJson) return;
                await pushDataJsonFilesToGithub({ accountsJson, recipesJson });
              } catch {
                /* ignore push failures */
              }
            })();
          }, 2500);
        }
      }
    } catch {
      /* ignore */
    }
  }, [seedBundle, seedReviews, userReviews, userRecipes]);

  useEffect(() => {
    const t = setTimeout(() => {
      void persistMergedRecipesSnapshot();
    }, 400);
    return () => clearTimeout(t);
  }, [persistMergedRecipesSnapshot]);

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

  const deleteRecipe = useCallback(
    async (recipeId: string): Promise<boolean> => {
      if (!userId) return false;
      const meta = recipes.find((r) => r.id === recipeId);
      if (!meta || !recipeId.startsWith('ur-')) return false;
      if (meta.createdByUserId != null && meta.createdByUserId !== userId) return false;

      const hadInUserList = userRecipes.some((r) => r.id === recipeId);
      const nextRecipes = userRecipes.filter((r) => r.id !== recipeId);
      setUserRecipes(nextRecipes);
      await persistRecipes(nextRecipes);

      setUserReviews((prev) => {
        if (!prev[recipeId]) return prev;
        const { [recipeId]: _removed, ...rest } = prev;
        void persistReviews(rest);
        return rest;
      });

      if (hadInUserList) {
        try {
          await decrementRecipeCount(userId);
          await refreshUser();
        } catch {
          /* ignore DB refresh errors */
        }
      }
      return true;
    },
    [userId, userRecipes, recipes, persistRecipes, persistReviews, refreshUser],
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
        const existingIdx = existing.findIndex((r) => r.user.id === review.user.id);
        let updated: Review[];
        if (existingIdx >= 0) {
          updated = [...existing];
          updated[existingIdx] = review;
        } else {
          updated = [review, ...existing];
        }
        const next = { ...prev, [review.recipeId]: updated };
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
      deleteRecipe,
      getReviewsForRecipe,
      addReview,
      exportMergedRecipesJson,
      applyPulledDataJson,
    }),
    [
      recipes,
      getRecipeById,
      addRecipe,
      deleteRecipe,
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
