import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '@/types';
import { recipes as seedRecipes } from '@/constants/MockData';
import { useAuth } from '@/contexts/AuthContext';

function storageKeyForUser(userId: string | null) {
  return userId ? `@chefd_user_recipes_${userId}` : '@chefd_user_recipes_anonymous';
}

type RecipeContextValue = {
  recipes: Recipe[];
  getRecipeById: (id: string) => Recipe | undefined;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'averageRating' | 'totalRatings'>) => string;
};

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    let cancelled = false;
    setUserRecipes([]);
    (async () => {
      const key = storageKeyForUser(userId);
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
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    async (next: Recipe[]) => {
      const key = storageKeyForUser(userId);
      try {
        await AsyncStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [userId],
  );

  const recipes = useMemo(
    () => [...seedRecipes, ...userRecipes],
    [userRecipes],
  );

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
      };
      setUserRecipes((prev) => {
        const merged = [...prev, next];
        persist(merged);
        return merged;
      });
      return id;
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      recipes,
      getRecipeById,
      addRecipe,
    }),
    [recipes, getRecipeById, addRecipe],
  );

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipes() {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipeProvider');
  return ctx;
}
