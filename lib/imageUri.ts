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

/**
 * Unsplash CDN URLs from `data/recipes.json` often use `?w=600` only. On some devices the image
 * never resolves (grey box). Adding `auto`, `fit`, and `q` matches Unsplash’s recommended params
 * and improves load reliability for React Native `Image`.
 */
export function enhanceRemoteImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http')) return trimmed;
  if (!trimmed.includes('images.unsplash.com')) return trimmed;
  try {
    const u = new URL(trimmed);
    if (!u.searchParams.has('auto')) u.searchParams.set('auto', 'format');
    if (!u.searchParams.has('fit')) u.searchParams.set('fit', 'crop');
    if (!u.searchParams.has('q')) u.searchParams.set('q', '85');
    if (!u.searchParams.has('w') && !u.searchParams.has('h')) {
      u.searchParams.set('w', '1200');
    }
    return u.toString();
  } catch {
    return trimmed;
  }
}

/** Recipe `image` from JSON or forms: trim and enhance Unsplash; empty string when missing. */
export function normalizeStoredRecipeImageUrl(image: string | undefined | null): string {
  const trimmed = typeof image === 'string' ? image.trim() : '';
  if (trimmed.length === 0) return '';
  return enhanceRemoteImageUrl(trimmed);
}
