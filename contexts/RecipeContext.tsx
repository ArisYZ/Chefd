import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '@/types';
import { recipes as seedRecipes } from '@/constants/MockData';

const STORAGE_KEY = '@chefd_user_recipes';

type RecipeContextValue = {
  recipes: Recipe[];
  getRecipeById: (id: string) => Recipe | undefined;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'averageRating' | 'totalRatings'>) => string;
};

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
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
  }, []);

  const persist = useCallback(async (next: Recipe[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
