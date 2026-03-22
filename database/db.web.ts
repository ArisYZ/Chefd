/**
 * Web fallback: expo-sqlite uses WASM workers that don't bundle cleanly for web.
 * Same API as db.native.ts using AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoredUser } from '@/types/auth';
import seedAccounts from '@/data/accounts.json';
import type { RepoAccountsFile } from './accountRepo';

const STORE_KEY = '@chefd_sqlite_web_users_v1';

type Persisted = {
  users: Array<
    StoredUser & {
      passwordHash: string | null;
    }
  >;
};

async function load(): Promise<Persisted> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (!raw) return { users: [] };
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed?.users || !Array.isArray(parsed.users)) return { users: [] };
    parsed.users = parsed.users.map((u) => ({
      ...u,
      favoriteRecipeIds: u.favoriteRecipeIds ?? [],
    }));
    return parsed;
  } catch {
    return { users: [] };
  }
}

async function save(data: Persisted): Promise<void> {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function toStored(u: Persisted['users'][0]): StoredUser {
  const { passwordHash: _, ...rest } = u;
  return rest;
}

export async function getDatabase(): Promise<null> {
  return null;
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const { users } = await load();
  const u = users.find((x) => x.id === id);
  return u ? toStored(u) : null;
}

export async function getUserByUsername(username: string): Promise<StoredUser | null> {
  const { users } = await load();
  const lower = username.trim().toLowerCase();
  const u = users.find((x) => x.username.toLowerCase() === lower);
  return u ? toStored(u) : null;
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const { users } = await load();
  const lower = email.trim().toLowerCase();
  const u = users.find((x) => (x.email || '').toLowerCase() === lower);
  return u ? toStored(u) : null;
}

export async function getUserByGoogleSub(sub: string): Promise<StoredUser | null> {
  const { users } = await load();
  const u = users.find((x) => x.googleSub === sub);
  return u ? toStored(u) : null;
}

export async function createUserLocal(input: {
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
}): Promise<StoredUser> {
  const data = await load();
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();
  const row: Persisted['users'][0] = {
    id,
    username: input.username.trim(),
    displayName: input.displayName.trim(),
    email: input.email.trim().toLowerCase(),
    avatarUri: null,
    bio: '',
    rankingScore: 0,
    leaderboardRank: 1,
    followersCount: 0,
    followingCount: 0,
    recipeCount: 0,
    reviewCount: 0,
    averageRating: 0,
    googleSub: null,
    createdAt: now,
    passwordHash: input.passwordHash,
    favoriteRecipeIds: [],
  };
  data.users.push(row);
  await recomputeLeaderboardRanksInternal(data);
  await save(data);
  return (await getUserById(id))!;
}

export async function createUserGoogle(input: {
  googleSub: string;
  email: string;
  displayName: string;
  avatarUri?: string | null;
}): Promise<StoredUser> {
  const data = await load();
  const existing = data.users.find((x) => x.googleSub === input.googleSub);
  if (existing) {
    await recomputeLeaderboardRanksInternal(data);
    await save(data);
    return toStored(existing);
  }
  const baseUsername = input.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20) || 'chef';
  let username = baseUsername;
  let suffix = 0;
  while (data.users.some((x) => x.username.toLowerCase() === username.toLowerCase())) {
    suffix += 1;
    username = `${baseUsername}${suffix}`;
  }
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();
  const row: Persisted['users'][0] = {
    id,
    username,
    displayName: input.displayName.trim(),
    email: input.email.trim().toLowerCase(),
    avatarUri: input.avatarUri ?? null,
    bio: '',
    rankingScore: 0,
    leaderboardRank: 1,
    followersCount: 0,
    followingCount: 0,
    recipeCount: 0,
    reviewCount: 0,
    averageRating: 0,
    googleSub: input.googleSub,
    createdAt: now,
    passwordHash: null,
    favoriteRecipeIds: [],
  };
  data.users.push(row);
  await recomputeLeaderboardRanksInternal(data);
  await save(data);
  return (await getUserById(id))!;
}

export async function getPasswordHashForUserId(userId: string): Promise<string | null> {
  const { users } = await load();
  return users.find((x) => x.id === userId)?.passwordHash ?? null;
}

function makeAgainToPoints(makeAgain: string): number {
  if (makeAgain === 'yes') return 12;
  if (makeAgain === 'maybe') return 6;
  return 3;
}

function makeAgainToScore(makeAgain: string): number {
  if (makeAgain === 'yes') return 10;
  if (makeAgain === 'maybe') return 5;
  return 0;
}

export async function recordUserReview(userId: string, makeAgain: 'yes' | 'no' | 'maybe'): Promise<void> {
  const data = await load();
  const u = data.users.find((x) => x.id === userId);
  if (!u) return;
  const points = makeAgainToPoints(makeAgain);
  const newScore = makeAgainToScore(makeAgain);
  const prevCount = u.reviewCount;
  const n = prevCount + 1;
  u.reviewCount = n;
  u.averageRating =
    n === 1 ? newScore : parseFloat(((u.averageRating * prevCount + newScore) / n).toFixed(2));
  u.rankingScore += points;
  await recomputeLeaderboardRanksInternal(data);
  await save(data);
}

export async function incrementRecipeCount(userId: string): Promise<void> {
  const data = await load();
  const u = data.users.find((x) => x.id === userId);
  if (!u) return;
  u.recipeCount += 1;
  u.rankingScore += 8;
  await recomputeLeaderboardRanksInternal(data);
  await save(data);
}

export async function decrementRecipeCount(userId: string): Promise<void> {
  const data = await load();
  const u = data.users.find((x) => x.id === userId);
  if (!u) return;
  if (u.recipeCount > 0) u.recipeCount -= 1;
  if (u.rankingScore >= 8) u.rankingScore -= 8;
  await recomputeLeaderboardRanksInternal(data);
  await save(data);
}

async function recomputeLeaderboardRanksInternal(data: Persisted): Promise<void> {
  const sorted = [...data.users].sort(
    (a, b) => b.rankingScore - a.rankingScore || a.createdAt - b.createdAt,
  );
  const idToRank = new Map<string, number>();
  sorted.forEach((u, i) => idToRank.set(u.id, i + 1));
  data.users.forEach((u) => {
    u.leaderboardRank = idToRank.get(u.id) ?? u.leaderboardRank;
  });
}

export async function recomputeLeaderboardRanks(): Promise<void> {
  const data = await load();
  await recomputeLeaderboardRanksInternal(data);
  await save(data);
}

export async function listUsersByRank(limit = 100): Promise<StoredUser[]> {
  const { users } = await load();
  const sorted = [...users].sort(
    (a, b) => b.rankingScore - a.rankingScore || a.createdAt - b.createdAt,
  );
  return sorted.slice(0, limit).map(toStored);
}

export async function updateProfile(
  userId: string,
  patch: { displayName?: string; bio?: string; avatarUri?: string | null },
): Promise<void> {
  const data = await load();
  const u = data.users.find((x) => x.id === userId);
  if (!u) return;
  if (patch.displayName !== undefined) u.displayName = patch.displayName;
  if (patch.bio !== undefined) u.bio = patch.bio;
  if (patch.avatarUri !== undefined) u.avatarUri = patch.avatarUri;
  await save(data);
}

export async function setFavoriteRecipeIds(userId: string, ids: string[]): Promise<void> {
  const data = await load();
  const u = data.users.find((x) => x.id === userId);
  if (!u) return;
  u.favoriteRecipeIds = [...new Set(ids)];
  await save(data);
}

export async function mergeAccountsFromPayload(file: RepoAccountsFile): Promise<void> {
  if (!file?.users?.length) return;
  const data = await load();
  const seedIds = new Set(file.users.map((u) => u.id));
  const localOnly = data.users.filter((u) => !seedIds.has(u.id));
  const seeded = file.users.map((u) => ({
    ...u,
    favoriteRecipeIds: u.favoriteRecipeIds ?? [],
    passwordHash: u.passwordHash ?? null,
  })) as Persisted['users'];
  data.users = [...localOnly, ...seeded];
  await recomputeLeaderboardRanksInternal(data);
  await save(data);
}

export async function mergeAccountsFromRepo(): Promise<void> {
  return mergeAccountsFromPayload(seedAccounts as RepoAccountsFile);
}

export async function exportAccountsJsonForRepo(): Promise<string> {
  const data = await load();
  return JSON.stringify({ users: data.users } satisfies RepoAccountsFile, null, 2);
}
