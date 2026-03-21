import type { StoredUser } from '@/types/auth';

/** One user row as stored in data/accounts.json (includes password hash for email accounts). */
export type RepoAccountUser = StoredUser & { passwordHash: string | null };

export type RepoAccountsFile = { users: RepoAccountUser[] };
