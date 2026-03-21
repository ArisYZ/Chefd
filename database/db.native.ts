import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import seedAccounts from '@/data/accounts.json';
import type { RepoAccountUser, RepoAccountsFile } from './accountRepo';

const DB_NAME = 'chefd.db';

let dbPromise: Promise<SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          username TEXT UNIQUE NOT NULL COLLATE NOCASE,
          display_name TEXT NOT NULL,
          email TEXT UNIQUE,
          password_hash TEXT,
          google_sub TEXT UNIQUE,
          avatar_uri TEXT,
          bio TEXT NOT NULL DEFAULT '',
          ranking_score INTEGER NOT NULL DEFAULT 0,
          leaderboard_rank INTEGER NOT NULL DEFAULT 0,
          followers_count INTEGER NOT NULL DEFAULT 0,
          following_count INTEGER NOT NULL DEFAULT 0,
          recipe_count INTEGER NOT NULL DEFAULT 0,
          review_count INTEGER NOT NULL DEFAULT 0,
          average_rating REAL NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_users_ranking ON users(ranking_score DESC);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      `);
      return db;
    })();
  }
  return dbPromise;
}

function rowToUser(row: Record<string, unknown>): import('@/types/auth').StoredUser {
  return {
    id: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
    email: row.email != null ? String(row.email) : null,
    avatarUri: row.avatar_uri != null ? String(row.avatar_uri) : null,
    bio: String(row.bio ?? ''),
    rankingScore: Number(row.ranking_score ?? 0),
    leaderboardRank: Number(row.leaderboard_rank ?? 0),
    followersCount: Number(row.followers_count ?? 0),
    followingCount: Number(row.following_count ?? 0),
    recipeCount: Number(row.recipe_count ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    averageRating: Number(row.average_rating ?? 0),
    googleSub: row.google_sub != null ? String(row.google_sub) : null,
    createdAt: Number(row.created_at ?? 0),
  };
}

export async function getUserById(id: string): Promise<import('@/types/auth').StoredUser | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM users WHERE id = ?',
    [id],
  );
  return row ? rowToUser(row) : null;
}

export async function getUserByUsername(username: string): Promise<import('@/types/auth').StoredUser | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM users WHERE username = ? COLLATE NOCASE',
    [username.trim()],
  );
  return row ? rowToUser(row) : null;
}

export async function getUserByEmail(email: string): Promise<import('@/types/auth').StoredUser | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM users WHERE email = ? COLLATE NOCASE',
    [email.trim().toLowerCase()],
  );
  return row ? rowToUser(row) : null;
}

export async function getUserByGoogleSub(sub: string): Promise<import('@/types/auth').StoredUser | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM users WHERE google_sub = ?',
    [sub],
  );
  return row ? rowToUser(row) : null;
}

export async function createUserLocal(input: {
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
}): Promise<import('@/types/auth').StoredUser> {
  const db = await getDatabase();
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO users (id, username, display_name, email, password_hash, google_sub, avatar_uri, bio, created_at)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, '', ?)`,
    [id, input.username.trim(), input.displayName.trim(), input.email.trim().toLowerCase(), input.passwordHash, now],
  );
  const u = await getUserById(id);
  if (!u) throw new Error('Failed to create user');
  await recomputeLeaderboardRanks();
  return (await getUserById(id))!;
}

export async function createUserGoogle(input: {
  googleSub: string;
  email: string;
  displayName: string;
  avatarUri?: string | null;
}): Promise<import('@/types/auth').StoredUser> {
  const db = await getDatabase();
  const existing = await getUserByGoogleSub(input.googleSub);
  if (existing) {
    await recomputeLeaderboardRanks();
    return existing;
  }
  const baseUsername = input.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20) || 'chef';
  let username = baseUsername;
  let suffix = 0;
  while (await getUserByUsername(username)) {
    suffix += 1;
    username = `${baseUsername}${suffix}`;
  }
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO users (id, username, display_name, email, password_hash, google_sub, avatar_uri, bio, created_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?, '', ?)`,
    [
      id,
      username,
      input.displayName.trim(),
      input.email.trim().toLowerCase(),
      input.googleSub,
      input.avatarUri ?? null,
      now,
    ],
  );
  await recomputeLeaderboardRanks();
  return (await getUserById(id))!;
}

export async function getPasswordHashForUserId(userId: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ password_hash: string | null }>(
    'SELECT password_hash FROM users WHERE id = ?',
    [userId],
  );
  return row?.password_hash ?? null;
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
  const db = await getDatabase();
  const user = await getUserById(userId);
  if (!user) return;
  const points = makeAgainToPoints(makeAgain);
  const newScore = makeAgainToScore(makeAgain);
  const n = user.reviewCount + 1;
  const avg =
    n === 1 ? newScore : parseFloat(((user.averageRating * user.reviewCount + newScore) / n).toFixed(2));
  const newRanking = user.rankingScore + points;
  await db.runAsync(
    `UPDATE users SET
      review_count = ?,
      average_rating = ?,
      ranking_score = ?
    WHERE id = ?`,
    [n, avg, newRanking, userId],
  );
  await recomputeLeaderboardRanks();
}

export async function incrementRecipeCount(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE users SET recipe_count = recipe_count + 1, ranking_score = ranking_score + 8 WHERE id = ?',
    [userId],
  );
  await recomputeLeaderboardRanks();
}

export async function recomputeLeaderboardRanks(): Promise<void> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM users ORDER BY ranking_score DESC, created_at ASC',
  );
  let rank = 1;
  for (const r of rows) {
    await db.runAsync('UPDATE users SET leaderboard_rank = ? WHERE id = ?', [rank, r.id]);
    rank += 1;
  }
}

export async function listUsersByRank(limit = 100): Promise<import('@/types/auth').StoredUser[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM users ORDER BY ranking_score DESC, created_at ASC LIMIT ?',
    [limit],
  );
  return rows.map(rowToUser);
}

export async function updateProfile(userId: string, patch: { displayName?: string; bio?: string; avatarUri?: string | null }): Promise<void> {
  const db = await getDatabase();
  const u = await getUserById(userId);
  if (!u) return;
  const displayName = patch.displayName ?? u.displayName;
  const bio = patch.bio ?? u.bio;
  const avatarUri = patch.avatarUri !== undefined ? patch.avatarUri : u.avatarUri;
  await db.runAsync(
    'UPDATE users SET display_name = ?, bio = ?, avatar_uri = ? WHERE id = ?',
    [displayName, bio, avatarUri, userId],
  );
}

/** Merge account rows into SQLite; repo payload wins for matching ids. */
export async function mergeAccountsFromPayload(file: RepoAccountsFile): Promise<void> {
  if (!file?.users?.length) return;
  const db = await getDatabase();
  for (const u of file.users) {
    await db.runAsync(
      `INSERT OR REPLACE INTO users (
        id, username, display_name, email, password_hash, google_sub, avatar_uri, bio,
        ranking_score, leaderboard_rank, followers_count, following_count,
        recipe_count, review_count, average_rating, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        u.id,
        u.username,
        u.displayName,
        u.email,
        u.passwordHash,
        u.googleSub,
        u.avatarUri,
        u.bio ?? '',
        u.rankingScore ?? 0,
        u.leaderboardRank ?? 0,
        u.followersCount ?? 0,
        u.followingCount ?? 0,
        u.recipeCount ?? 0,
        u.reviewCount ?? 0,
        u.averageRating ?? 0,
        u.createdAt,
      ],
    );
  }
  await recomputeLeaderboardRanks();
}

/** Merge rows from bundled data/accounts.json into SQLite. */
export async function mergeAccountsFromRepo(): Promise<void> {
  return mergeAccountsFromPayload(seedAccounts as RepoAccountsFile);
}

/** Full snapshot for replacing data/accounts.json in git (includes password hashes). */
export async function exportAccountsJsonForRepo(): Promise<string> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM users');
  const users: RepoAccountUser[] = rows.map((row) => ({
    ...rowToUser(row),
    passwordHash: row.password_hash != null ? String(row.password_hash) : null,
  }));
  return JSON.stringify({ users } satisfies RepoAccountsFile, null, 2);
}
