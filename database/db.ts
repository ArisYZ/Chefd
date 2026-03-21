/**
 * Native uses SQLite; web uses AsyncStorage (see db.web.ts) so we never load
 * expo-sqlite's WASM bundle on web.
 */
import { Platform } from 'react-native';
import type { StoredUser } from '@/types/auth';
import type { RepoAccountsFile } from './accountRepo';

type DbModule = typeof import('./db.native');

let cached: DbModule | null = null;

async function impl(): Promise<DbModule> {
  if (cached) return cached;
  if (Platform.OS === 'web') {
    cached = (await import('./db.web')) as unknown as DbModule;
  } else {
    cached = await import('./db.native');
  }
  return cached;
}

export async function getDatabase() {
  return (await impl()).getDatabase();
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  return (await impl()).getUserById(id);
}

export async function getUserByUsername(username: string): Promise<StoredUser | null> {
  return (await impl()).getUserByUsername(username);
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  return (await impl()).getUserByEmail(email);
}

export async function getUserByGoogleSub(sub: string): Promise<StoredUser | null> {
  return (await impl()).getUserByGoogleSub(sub);
}

export async function createUserLocal(input: {
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
}): Promise<StoredUser> {
  return (await impl()).createUserLocal(input);
}

export async function createUserGoogle(input: {
  googleSub: string;
  email: string;
  displayName: string;
  avatarUri?: string | null;
}): Promise<StoredUser> {
  return (await impl()).createUserGoogle(input);
}

export async function getPasswordHashForUserId(userId: string): Promise<string | null> {
  return (await impl()).getPasswordHashForUserId(userId);
}

export async function recordUserReview(userId: string, makeAgain: 'yes' | 'no' | 'maybe'): Promise<void> {
  return (await impl()).recordUserReview(userId, makeAgain);
}

export async function incrementRecipeCount(userId: string): Promise<void> {
  return (await impl()).incrementRecipeCount(userId);
}

export async function recomputeLeaderboardRanks(): Promise<void> {
  return (await impl()).recomputeLeaderboardRanks();
}

export async function listUsersByRank(limit?: number): Promise<StoredUser[]> {
  return (await impl()).listUsersByRank(limit);
}

export async function updateProfile(
  userId: string,
  patch: { displayName?: string; bio?: string; avatarUri?: string | null },
): Promise<void> {
  return (await impl()).updateProfile(userId, patch);
}

export async function mergeAccountsFromRepo(): Promise<void> {
  return (await impl()).mergeAccountsFromRepo();
}

export async function mergeAccountsFromPayload(file: RepoAccountsFile): Promise<void> {
  return (await impl()).mergeAccountsFromPayload(file);
}

export async function mergeAccountsFromJsonString(json: string): Promise<void> {
  const parsed = JSON.parse(json) as RepoAccountsFile;
  return (await impl()).mergeAccountsFromPayload(parsed);
}

export async function exportAccountsJsonForRepo(): Promise<string> {
  return (await impl()).exportAccountsJsonForRepo();
}
