import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const LIKES_KEY = '@chefd_likes_v2';

type SocialState = {
  likedOverrides: Record<string, boolean>; // id -> isLiked (true/false)
  countOverrides: Record<string, number>; // id -> count
};

type SocialContextValue = {
  isLiked: (id: string, initialLiked: boolean) => boolean;
  getLikeCount: (id: string, initialCount: number) => number;
  toggleLike: (id: string, initialCount: number, initialLiked: boolean) => void;
};

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? 'anonymous';
  const [likedOverrides, setLikedOverrides] = useState<Record<string, boolean>>({});
  const [countOverrides, setCountOverrides] = useState<Record<string, number>>({});

  const storageKey = `${LIKES_KEY}_${userId}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as SocialState;
          if (parsed) {
            if (parsed.likedOverrides) setLikedOverrides(parsed.likedOverrides);
            if (parsed.countOverrides) setCountOverrides(parsed.countOverrides);
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [storageKey]);

  const persist = useCallback(
    async (nextLiked: Record<string, boolean>, nextCounts: Record<string, number>) => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify({
          likedOverrides: nextLiked,
          countOverrides: nextCounts,
        }));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const isLiked = useCallback(
    (id: string, initialLiked: boolean) => {
      return likedOverrides[id] ?? initialLiked;
    },
    [likedOverrides],
  );

  const getLikeCount = useCallback(
    (id: string, initialCount: number) => {
      return countOverrides[id] ?? initialCount;
    },
    [countOverrides],
  );

  const toggleLike = useCallback(
    (id: string, initialCount: number, initialLiked: boolean) => {
      const currentLiked = likedOverrides[id] ?? initialLiked;
      const currentCount = countOverrides[id] ?? initialCount;

      const nextLiked = !currentLiked;
      const nextCount = nextLiked ? currentCount + 1 : currentCount - 1;

      const newLikedOverrides = { ...likedOverrides, [id]: nextLiked };
      const newCountOverrides = { ...countOverrides, [id]: nextCount };

      setLikedOverrides(newLikedOverrides);
      setCountOverrides(newCountOverrides);
      persist(newLikedOverrides, newCountOverrides);
    },
    [likedOverrides, countOverrides, persist],
  );

  const value = useMemo(
    () => ({
      isLiked,
      getLikeCount,
      toggleLike,
    }),
    [isLiked, getLikeCount, toggleLike],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used within SocialProvider');
  return ctx;
}
