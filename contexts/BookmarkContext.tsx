import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookmarkCollection, BookmarkData } from '@/types';
import { useAuth } from './AuthContext';

const BOOKMARKS_KEY = '@chefd_bookmarks';

type BookmarkContextValue = {
  bookmarkedIds: string[];
  collections: BookmarkCollection[];
  isBookmarked: (recipeId: string) => boolean;
  toggleBookmark: (recipeId: string) => void;
  /** Remove a recipe from saved list and all collections (e.g. after delete). */
  removeRecipeFromBookmarks: (recipeId: string) => void;
  createCollection: (name: string) => string;
  deleteCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;
  addToCollection: (collectionId: string, recipeId: string) => void;
  removeFromCollection: (collectionId: string, recipeId: string) => void;
  getCollectionsForRecipe: (recipeId: string) => BookmarkCollection[];
};

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? 'anonymous';
  const [data, setData] = useState<BookmarkData>({ all: [], collections: [] });

  const storageKey = `${BOOKMARKS_KEY}_${userId}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as BookmarkData;
          if (parsed && Array.isArray(parsed.all)) setData(parsed);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [storageKey]);

  const persist = useCallback(
    async (next: BookmarkData) => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const isBookmarked = useCallback(
    (recipeId: string) => data.all.includes(recipeId),
    [data.all],
  );

  const toggleBookmark = useCallback(
    (recipeId: string) => {
      setData((prev) => {
        const exists = prev.all.includes(recipeId);
        const all = exists
          ? prev.all.filter((id) => id !== recipeId)
          : [recipeId, ...prev.all];
        const collections = exists
          ? prev.collections.map((c) => ({
              ...c,
              recipeIds: c.recipeIds.filter((id) => id !== recipeId),
            }))
          : prev.collections;
        const next = { ...prev, all, collections };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeRecipeFromBookmarks = useCallback(
    (recipeId: string) => {
      setData((prev) => {
        const all = prev.all.filter((id) => id !== recipeId);
        const collections = prev.collections.map((c) => ({
          ...c,
          recipeIds: c.recipeIds.filter((id) => id !== recipeId),
        }));
        const next = { ...prev, all, collections };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const createCollection = useCallback(
    (name: string) => {
      const id = `col-${Date.now()}`;
      setData((prev) => {
        const col: BookmarkCollection = {
          id,
          name: name.slice(0, 50),
          recipeIds: [],
          createdAt: Date.now(),
        };
        const next = { ...prev, collections: [...prev.collections, col] };
        persist(next);
        return next;
      });
      return id;
    },
    [persist],
  );

  const deleteCollection = useCallback(
    (id: string) => {
      setData((prev) => {
        const next = { ...prev, collections: prev.collections.filter((c) => c.id !== id) };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const renameCollection = useCallback(
    (id: string, name: string) => {
      setData((prev) => {
        const next = {
          ...prev,
          collections: prev.collections.map((c) =>
            c.id === id ? { ...c, name: name.slice(0, 50) } : c,
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const addToCollection = useCallback(
    (collectionId: string, recipeId: string) => {
      setData((prev) => {
        const next = {
          ...prev,
          collections: prev.collections.map((c) =>
            c.id === collectionId && !c.recipeIds.includes(recipeId)
              ? { ...c, recipeIds: [...c.recipeIds, recipeId] }
              : c,
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeFromCollection = useCallback(
    (collectionId: string, recipeId: string) => {
      setData((prev) => {
        const next = {
          ...prev,
          collections: prev.collections.map((c) =>
            c.id === collectionId
              ? { ...c, recipeIds: c.recipeIds.filter((id) => id !== recipeId) }
              : c,
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const getCollectionsForRecipe = useCallback(
    (recipeId: string) =>
      data.collections.filter((c) => c.recipeIds.includes(recipeId)),
    [data.collections],
  );

  const value = useMemo(
    () => ({
      bookmarkedIds: data.all,
      collections: data.collections,
      isBookmarked,
      toggleBookmark,
      removeRecipeFromBookmarks,
      createCollection,
      deleteCollection,
      renameCollection,
      addToCollection,
      removeFromCollection,
      getCollectionsForRecipe,
    }),
    [
      data.all,
      data.collections,
      isBookmarked,
      toggleBookmark,
      removeRecipeFromBookmarks,
      createCollection,
      deleteCollection,
      renameCollection,
      addToCollection,
      removeFromCollection,
      getCollectionsForRecipe,
    ],
  );

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
}
