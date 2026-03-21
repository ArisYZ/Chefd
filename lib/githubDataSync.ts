import Constants from 'expo-constants';

const PATH_ACCOUNTS = 'data/accounts.json';
const PATH_RECIPES = 'data/recipes.json';

function extra(): Record<string, string | undefined> {
  return (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
}

export type GithubDataSyncConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

/** Reads Expo env and app.json extra (githubToken, githubRepo, githubBranch). */
export function getGithubDataSyncConfig(): GithubDataSyncConfig | null {
  const e = extra();
  const token = process.env.EXPO_PUBLIC_GITHUB_TOKEN ?? e.githubToken;
  const repoFull = process.env.EXPO_PUBLIC_GITHUB_REPO ?? e.githubRepo;
  const branch = process.env.EXPO_PUBLIC_GITHUB_BRANCH ?? e.githubBranch ?? 'main';
  if (!token || !repoFull) return null;
  const parts = repoFull.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0]!;
  const repo = parts.slice(1).join('/');
  return { token, owner, repo, branch };
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const clean = b64.replace(/\n/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function githubHeaders(cfg: GithubDataSyncConfig): HeadersInit {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function getFileShaAndContent(
  cfg: GithubDataSyncConfig,
  path: string,
): Promise<{ sha: string; content: string } | null> {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await fetch(url, { headers: githubHeaders(cfg) });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub GET ${path}: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { sha?: string; content?: string; encoding?: string };
  if (typeof data.sha !== 'string' || typeof data.content !== 'string') {
    throw new Error(`GitHub: unexpected response for ${path}`);
  }
  return { sha: data.sha, content: base64ToUtf8(data.content) };
}

async function putFile(cfg: GithubDataSyncConfig, path: string, content: string, message: string): Promise<void> {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  const existing = await getFileShaAndContent(cfg, path);
  const body: Record<string, string> = {
    message,
    content: utf8ToBase64(content),
    branch: cfg.branch,
  };
  if (existing?.sha) body.sha = existing.sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...githubHeaders(cfg),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`GitHub PUT ${path}: ${res.status} ${await res.text()}`);
  }
}

/**
 * Commit and push both JSON files (two commits). Requires a classic PAT with `repo` scope.
 */
export async function pushDataJsonFilesToGithub(opts: {
  accountsJson: string;
  recipesJson: string;
}): Promise<void> {
  const cfg = getGithubDataSyncConfig();
  if (!cfg) {
    throw new Error(
      'GitHub is not configured. Set EXPO_PUBLIC_GITHUB_TOKEN and EXPO_PUBLIC_GITHUB_REPO (owner/name) in .env, or expo.extra.githubToken / githubRepo.',
    );
  }
  await putFile(cfg, PATH_ACCOUNTS, opts.accountsJson, 'chore(data): update accounts.json');
  await putFile(cfg, PATH_RECIPES, opts.recipesJson, 'chore(data): update recipes.json');
}

export async function pullDataJsonFilesFromGithub(): Promise<{
  accountsJson: string;
  recipesJson: string;
}> {
  const cfg = getGithubDataSyncConfig();
  if (!cfg) {
    throw new Error(
      'GitHub is not configured. Set EXPO_PUBLIC_GITHUB_TOKEN and EXPO_PUBLIC_GITHUB_REPO (owner/name) in .env, or expo.extra.githubToken / githubRepo.',
    );
  }
  const a = await getFileShaAndContent(cfg, PATH_ACCOUNTS);
  const r = await getFileShaAndContent(cfg, PATH_RECIPES);
  if (!a?.content) throw new Error(`Remote ${PATH_ACCOUNTS} missing or empty`);
  if (!r?.content) throw new Error(`Remote ${PATH_RECIPES} missing or empty`);
  return { accountsJson: a.content, recipesJson: r.content };
}
