/** Decode JWT payload (no signature verification). */
export function parseJwtPayload<T extends Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (b64.length % 4)) % 4;
    b64 += '='.repeat(pad);
    if (typeof atob !== 'function') return null;
    const json = atob(b64);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
