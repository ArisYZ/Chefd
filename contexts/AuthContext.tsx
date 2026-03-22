import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import type { StoredUser } from '@/types/auth';
import {
  createUserGoogle,
  createUserLocal,
  getDatabase,
  getPasswordHashForUserId,
  getUserByEmail,
  getUserByGoogleSub,
  getUserById,
  getUserByUsername,
  incrementRecipeCount,
  mergeAccountsFromRepo,
  recordUserReview,
  setFavoriteRecipeIds,
  updateProfile as persistProfile,
} from '@/database/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import { normalizeRemoteImageUri } from '@/lib/imageUri';

const SESSION_KEY = '@chefd_session_user_id';

type AuthContextValue = {
  ready: boolean;
  user: StoredUser | null;
  signIn: (usernameOrEmail: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signUp: (
    username: string,
    displayName: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
  /** Call after Google OAuth returns an ID token (handled on auth screen). */
  completeGoogleSignIn: (input: {
    idToken: string;
    sub: string;
    email: string;
    name: string;
    picture?: string;
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
  refreshUser: () => Promise<void>;
  /** When the logged-in user submits a recipe review. */
  onUserSubmittedReview: (makeAgain: 'yes' | 'no' | 'maybe') => Promise<void>;
  /** When the logged-in user creates a new recipe. */
  onUserCreatedRecipe: () => Promise<void>;
  updateProfile: (patch: {
    displayName?: string;
    bio?: string;
    avatarUri?: string | null;
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Toggle favorite for the signed-in user; persisted on the account row (exported in accounts JSON). */
  toggleFavoriteRecipe: (recipeId: string) => Promise<void>;
  /** Remove id from favorites if present (e.g. when deleting your recipe). */
  removeRecipeFromFavorites: (recipeId: string) => Promise<void>;
  isFavoriteRecipe: (recipeId: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  const refreshUser = useCallback(async () => {
    const id = await AsyncStorage.getItem(SESSION_KEY);
    if (!id) {
      setUser(null);
      return;
    }
    const u = await getUserById(id);
    setUser(u);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getDatabase();
        await mergeAccountsFromRepo();
        const id = await AsyncStorage.getItem(SESSION_KEY);
        if (cancelled) return;
        if (id) {
          const u = await getUserById(id);
          if (!cancelled) setUser(u);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (usernameOrEmail: string, password: string) => {
    const trimmed = usernameOrEmail.trim();
    if (!trimmed || !password) {
      return { ok: false as const, message: 'Enter username/email and password.' };
    }
    const byName = await getUserByUsername(trimmed);
    const byEmail = !byName ? await getUserByEmail(trimmed) : null;
    const u = byName ?? byEmail;
    if (!u) return { ok: false as const, message: 'Account not found.' };
    const hash = await getPasswordHashForUserId(u.id);
    if (!hash) return { ok: false as const, message: 'Use Google sign-in for this account.' };
    const ok = await verifyPassword(password, hash);
    if (!ok) return { ok: false as const, message: 'Wrong password.' };
    await AsyncStorage.setItem(SESSION_KEY, u.id);
    const fresh = await getUserById(u.id);
    setUser(fresh);
    return { ok: true as const };
  }, []);

  const signUp = useCallback(async (username: string, displayName: string, email: string, password: string) => {
    const u = username.trim();
    const em = email.trim().toLowerCase();
    if (u.length < 3 || u.length > 20) return { ok: false as const, message: 'Username must be 3-20 characters.' };
    if (!/^[a-zA-Z0-9_-]+$/.test(u)) return { ok: false as const, message: 'Username can only contain letters, numbers, underscore, and hyphen.' };
    if (!em.includes('@')) return { ok: false as const, message: 'Enter a valid email.' };
    if (password.length < 8) return { ok: false as const, message: 'Password must be at least 8 characters.' };
    if (!/\d/.test(password)) return { ok: false as const, message: 'Password must include at least one number.' };
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { ok: false as const, message: 'Password must include at least one special character.' };
    if (await getUserByUsername(u)) return { ok: false as const, message: 'Username already taken.' };
    if (await getUserByEmail(em)) return { ok: false as const, message: 'Email already registered.' };
    const passwordHash = await hashPassword(password);
    const created = await createUserLocal({
      username: u,
      displayName: displayName.trim() || u,
      email: em,
      passwordHash,
    });
    await AsyncStorage.setItem(SESSION_KEY, created.id);
    setUser(await getUserById(created.id));
    return { ok: true as const };
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
    router.replace('/auth' as any);
  }, []);

  const completeGoogleSignIn = useCallback(
    async (input: {
      idToken: string;
      sub: string;
      email: string;
      name: string;
      picture?: string;
    }) => {
      if (!input.sub || !input.email) {
        return { ok: false as const, message: 'Google did not return a valid profile.' };
      }
      try {
        let u = await getUserByGoogleSub(input.sub);
        if (!u) {
          const existingEmail = await getUserByEmail(input.email);
          if (existingEmail?.googleSub === input.sub) {
            u = existingEmail;
          } else if (existingEmail) {
            if (!existingEmail.googleSub) {
              return {
                ok: false as const,
                message: 'This email is already registered. Sign in with email and password.',
              };
            }
            return {
              ok: false as const,
              message: 'This email is linked to a different Google account.',
            };
          } else {
            u = await createUserGoogle({
              googleSub: input.sub,
              email: input.email,
              displayName: input.name || input.email.split('@')[0],
              avatarUri: normalizeRemoteImageUri(input.picture),
            });
          }
        }
        await AsyncStorage.setItem(SESSION_KEY, u.id);
        setUser(await getUserById(u.id));
        return { ok: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Google sign-in failed.';
        return { ok: false as const, message: msg };
      }
    },
    [],
  );

  const onUserSubmittedReview = useCallback(async (makeAgain: 'yes' | 'no' | 'maybe') => {
    const id = user?.id;
    if (!id) return;
    await recordUserReview(id, makeAgain);
    await refreshUser();
  }, [user?.id, refreshUser]);

  const onUserCreatedRecipe = useCallback(async () => {
    const id = user?.id;
    if (!id) return;
    await incrementRecipeCount(id);
    await refreshUser();
  }, [user?.id, refreshUser]);

  const updateProfile = useCallback(
    async (patch: { displayName?: string; bio?: string; avatarUri?: string | null }) => {
      const id = user?.id;
      if (!id) return { ok: false as const, message: 'Not signed in.' };
      try {
        await persistProfile(id, patch);
        await refreshUser();
        return { ok: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not update profile.';
        return { ok: false as const, message: msg };
      }
    },
    [user?.id, refreshUser],
  );

  const toggleFavoriteRecipe = useCallback(
    async (recipeId: string) => {
      const id = user?.id;
      if (!id) return;
      const current = user?.favoriteRecipeIds ?? [];
      const next = current.includes(recipeId)
        ? current.filter((x) => x !== recipeId)
        : [...current, recipeId];
      await setFavoriteRecipeIds(id, next);
      await refreshUser();
    },
    [user, refreshUser],
  );

  const removeRecipeFromFavorites = useCallback(
    async (recipeId: string) => {
      const id = user?.id;
      if (!id) return;
      const current = user?.favoriteRecipeIds ?? [];
      if (!current.includes(recipeId)) return;
      const next = current.filter((x) => x !== recipeId);
      await setFavoriteRecipeIds(id, next);
      await refreshUser();
    },
    [user, refreshUser],
  );

  const isFavoriteRecipe = useCallback(
    (recipeId: string) => (user?.favoriteRecipeIds ?? []).includes(recipeId),
    [user?.favoriteRecipeIds],
  );

  const value = useMemo(
    () => ({
      ready,
      user,
      signIn,
      signUp,
      signOut,
      completeGoogleSignIn,
      refreshUser,
      onUserSubmittedReview,
      onUserCreatedRecipe,
      updateProfile,
      toggleFavoriteRecipe,
      removeRecipeFromFavorites,
      isFavoriteRecipe,
    }),
    [
      ready,
      user,
      signIn,
      signUp,
      signOut,
      completeGoogleSignIn,
      refreshUser,
      onUserSubmittedReview,
      onUserCreatedRecipe,
      updateProfile,
      toggleFavoriteRecipe,
      removeRecipeFromFavorites,
      isFavoriteRecipe,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
