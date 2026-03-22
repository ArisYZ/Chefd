import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { SEED_FOLLOW_GRAPH } from '@/constants/MockData';

const FOLLOW_STORAGE_KEY = '@chefd_follows_v1';

type FollowGraph = Record<string, string[]>;

/** Users who follow `userId` in the bundled seed graph only. */
function followersFromSeedGraph(userId: string): string[] {
  const out: string[] = [];
  for (const [fid, list] of Object.entries(SEED_FOLLOW_GRAPH)) {
    if (list.includes(userId)) out.push(fid);
  }
  return out;
}

/**
 * Following list for feed + UI. Uses persisted `graph` when the key exists (including `[]`);
 * otherwise falls back to seed data so new accounts (ids not in the graph) still see the demo network.
 */
function effectiveFollowingList(graph: FollowGraph, userId: string): string[] {
  if (graph[userId] !== undefined) return graph[userId]!;
  return SEED_FOLLOW_GRAPH[userId] ?? SEED_FOLLOW_GRAPH['u_test_account_1'] ?? [];
}

/**
 * Followers from the merged graph; if none (typical for brand-new account ids), use seed followers.
 */
function effectiveFollowersList(graph: FollowGraph, userId: string): string[] {
  const fromGraph: string[] = [];
  for (const [fid, list] of Object.entries(graph)) {
    if (list.includes(userId)) fromGraph.push(fid);
  }
  if (fromGraph.length > 0) return fromGraph;
  const fromSeed = followersFromSeedGraph(userId);
  if (fromSeed.length > 0) return fromSeed;
  return followersFromSeedGraph('u_test_account_1');
}

function followingListForMutation(graph: FollowGraph, userId: string): string[] {
  if (graph[userId] !== undefined) return [...graph[userId]!];
  const seed = SEED_FOLLOW_GRAPH[userId] ?? SEED_FOLLOW_GRAPH['u_test_account_1'] ?? [];
  return [...seed];
}

type FollowContextValue = {
  /** Whether the current signed-in user follows `targetId`. */
  isFollowing: (targetId: string) => boolean;
  /** List of user ids the given user follows. */
  getFollowing: (userId: string) => string[];
  /** List of user ids that follow the given user. */
  getFollowers: (userId: string) => string[];
  getFollowingCount: (userId: string) => number;
  getFollowersCount: (userId: string) => number;
  /**
   * Set of user ids connected to the current user (union of following + followers).
   * Used to filter the activity feed.
   */
  connectedUserIds: Set<string>;
  followUser: (targetId: string) => void;
  unfollowUser: (targetId: string) => void;
};

const FollowContext = createContext<FollowContextValue | null>(null);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [graph, setGraph] = useState<FollowGraph>(() => ({ ...SEED_FOLLOW_GRAPH }));
  const [loaded, setLoaded] = useState(false);

  const storageKey = userId
    ? `${FOLLOW_STORAGE_KEY}_${userId}`
    : `${FOLLOW_STORAGE_KEY}_anonymous`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (cancelled) return;
        if (raw) {
          const persisted = JSON.parse(raw) as FollowGraph;
          if (persisted && typeof persisted === 'object') {
            setGraph({ ...SEED_FOLLOW_GRAPH, ...persisted });
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const persist = useCallback(
    async (next: FollowGraph) => {
      try {
        const delta: FollowGraph = {};
        for (const [uid, list] of Object.entries(next)) {
          const seed = SEED_FOLLOW_GRAPH[uid];
          if (!seed || JSON.stringify(list.slice().sort()) !== JSON.stringify(seed.slice().sort())) {
            delta[uid] = list;
          }
        }
        await AsyncStorage.setItem(storageKey, JSON.stringify(delta));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const isFollowing = useCallback(
    (targetId: string) => {
      if (!userId) return false;
      return effectiveFollowingList(graph, userId).includes(targetId);
    },
    [userId, graph],
  );

  const getFollowing = useCallback(
    (uid: string) => effectiveFollowingList(graph, uid),
    [graph],
  );

  const getFollowers = useCallback(
    (uid: string) => effectiveFollowersList(graph, uid),
    [graph],
  );

  const getFollowingCount = useCallback(
    (uid: string) => effectiveFollowingList(graph, uid).length,
    [graph],
  );

  const getFollowersCount = useCallback(
    (uid: string) => effectiveFollowersList(graph, uid).length,
    [graph],
  );

  const connectedUserIds = useMemo(() => {
    if (!userId) return new Set<string>();
    const following = effectiveFollowingList(graph, userId);
    const followers = effectiveFollowersList(graph, userId);
    return new Set([...following, ...followers]);
  }, [userId, graph]);

  const followUser = useCallback(
    (targetId: string) => {
      if (!userId || userId === targetId) return;
      setGraph((prev) => {
        const current = followingListForMutation(prev, userId);
        if (current.includes(targetId)) return prev;
        const next = { ...prev, [userId]: [...current, targetId] };
        persist(next);
        return next;
      });
    },
    [userId, persist],
  );

  const unfollowUser = useCallback(
    (targetId: string) => {
      if (!userId) return;
      setGraph((prev) => {
        const current = followingListForMutation(prev, userId);
        if (!current.includes(targetId)) return prev;
        const next = { ...prev, [userId]: current.filter((id) => id !== targetId) };
        persist(next);
        return next;
      });
    },
    [userId, persist],
  );

  const value = useMemo(
    () => ({
      isFollowing,
      getFollowing,
      getFollowers,
      getFollowingCount,
      getFollowersCount,
      connectedUserIds,
      followUser,
      unfollowUser,
    }),
    [
      isFollowing,
      getFollowing,
      getFollowers,
      getFollowingCount,
      getFollowersCount,
      connectedUserIds,
      followUser,
      unfollowUser,
    ],
  );

  return <FollowContext.Provider value={value}>{children}</FollowContext.Provider>;
}

export function useFollow() {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error('useFollow must be used within FollowProvider');
  return ctx;
}
