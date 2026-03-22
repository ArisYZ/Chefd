/**
 * Coerce API/storage values into a plain URL string for React Native `Image` `source={{ uri }}`.
 * Prevents Android crashes when `uri` is mistakenly nested (e.g. `{ uri: { uri: '...' } }`) or non-string.
 */
export function normalizeRemoteImageUri(raw: unknown): string | null {
  let current: unknown = raw;
  for (let depth = 0; depth < 5; depth++) {
    if (current == null) return null;
    if (typeof current === 'string') {
      const s = current.trim();
      return s.length > 0 ? s : null;
    }
    if (typeof current === 'object' && current !== null && 'uri' in current) {
      current = (current as { uri: unknown }).uri;
      continue;
    }
    return null;
  }
  return null;
}
