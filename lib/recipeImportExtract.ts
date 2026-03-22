/**
 * Helpers for parsing recipe pages (schema.org / JSON-LD, meta tags).
 */

/** Parse ISO 8601 duration to total minutes (e.g. PT1H30M, PT45M, P1DT2H). */
export function iso8601DurationToMinutes(iso: string | undefined | null): number | null {
  if (!iso || typeof iso !== 'string') return null;
  const s = iso.trim();
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const m = s.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!m) return null;
  const days = parseInt(m[1] || '0', 10) || 0;
  const hours = parseInt(m[2] || '0', 10) || 0;
  const minutes = parseFloat(m[3] || '0') || 0;
  const seconds = parseFloat(m[4] || '0') || 0;
  const total = days * 24 * 60 + hours * 60 + minutes + seconds / 60;
  return Math.max(0, Math.round(total));
}

export function extractPrepCookMinutes(jsonLd: Record<string, unknown> | null | undefined): {
  prepTime: number;
  cookTime: number;
} {
  if (!jsonLd || typeof jsonLd !== 'object') return { prepTime: 0, cookTime: 0 };
  const prep =
    iso8601DurationToMinutes(jsonLd.prepTime as string | undefined) ?? 0;
  let cook = iso8601DurationToMinutes(jsonLd.cookTime as string | undefined) ?? 0;
  const total = iso8601DurationToMinutes(jsonLd.totalTime as string | undefined);
  if (cook === 0 && total != null && total > 0) {
    const rest = total - prep;
    cook = rest > 0 ? rest : total;
  }
  return { prepTime: prep, cookTime: cook };
}

function resolveUrl(href: string, basePageUrl: string): string | null {
  const t = href.trim();
  if (!t) return null;
  try {
    return new URL(t, basePageUrl).href;
  } catch {
    return t.startsWith('http') ? t : null;
  }
}

/** Normalize schema.org Recipe image (string | ImageObject | array). */
export function pickRecipeImageUrl(
  image: unknown,
  pageUrl: string,
): string | null {
  if (!image) return null;
  const one = (raw: unknown): string | null => {
    if (typeof raw === 'string') return resolveUrl(raw, pageUrl);
    if (raw && typeof raw === 'object') {
      const o = raw as Record<string, unknown>;
      if (typeof o.url === 'string') return resolveUrl(o.url, pageUrl);
      if (typeof o.contentUrl === 'string') return resolveUrl(o.contentUrl, pageUrl);
    }
    return null;
  };
  if (typeof image === 'string') return one(image);
  if (Array.isArray(image)) {
    for (const item of image) {
      const u = one(item);
      if (u) return u;
    }
    return null;
  }
  return one(image);
}

/** Fallback image from HTML meta / link tags. */
export function extractImageFromHtml(html: string, pageUrl: string): string | null {
  const patterns: RegExp[] = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const u = resolveUrl(m[1], pageUrl);
      if (u) return u;
    }
  }
  return null;
}
